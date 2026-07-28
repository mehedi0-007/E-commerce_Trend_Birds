import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateRoleDto } from "./dto/create-role.dto";
import { QueryRoleDto } from "./dto/query-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryRoleDto) {
    const { search, active, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    if (active !== undefined) {
      where.active = active;
    }

    const [roles, total] = await Promise.all([
      this.prisma.role.findMany({
        where,
        include: {
          _count: {
            select: { users: true },
          },
          permissions: {
            include: {
              permission: {
                select: { id: true, name: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      
      this.prisma.role.count({ where }),
    ]);

    const formattedRoles = roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      active: role.active,
      userCount: role._count.users,
      permissions: role.permissions.map((p) => p.permission),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    }));

    return {
      data: formattedRoles,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true },
        },
        permissions: {
          include: {
            permission: {
              include: {
                group: true,
              },
            },
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID "${id}" not found`);
    }

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      active: role.active,
      userCount: role._count.users,
      permissionIds: role.permissions.map((p) => p.permissionId),
      permissions: role.permissions.map((p) => p.permission),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }

  async create(dto: CreateRoleDto) {
    const existing = await this.prisma.role.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException(`Role with name "${dto.name}" already exists`);
    }

    let targetPermissionIds: string[] = [];

    if (dto.grantAll) {
      const allPerms = await this.prisma.permission.findMany({
        select: { id: true },
      });
      targetPermissionIds = allPerms.map((p) => p.id);
    } else if (dto.permissionIds && dto.permissionIds.length > 0) {
      targetPermissionIds = dto.permissionIds;
    }

    return this.prisma.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: {
          name: dto.name,
          description: dto.description,
          active: dto.active ?? true,
        },
      });

      if (targetPermissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: targetPermissionIds.map((permissionId) => ({
            roleId: role.id,
            permissionId,
          })),
        });
      }

      return this.findOne(role.id);
    });
  }

  async update(id: string, dto: UpdateRoleDto) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { permissions: { include: { permission: true } } },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID "${id}" not found`);
    }

    if (dto.name && dto.name !== role.name) {
      const existing = await this.prisma.role.findUnique({
        where: { name: dto.name },
      });
      if (existing) {
        throw new ConflictException(`Role with name "${dto.name}" already exists`);
      }
    }

    // Determine target permission IDs
    let targetPermissionIds: string[] | undefined = undefined;
    if (dto.grantAll) {
      const allPerms = await this.prisma.permission.findMany({
        select: { id: true },
      });
      targetPermissionIds = allPerms.map((p) => p.id);
    } else if (dto.permissionIds !== undefined) {
      targetPermissionIds = dto.permissionIds;
    }

    // Self-lockout check for role:update
    if (targetPermissionIds !== undefined) {
      const isRoleUpdateRevoked = await this.wouldRevokeRoleUpdate(
        id,
        targetPermissionIds,
      );
      if (isRoleUpdateRevoked) {
        throw new BadRequestException(
          "Cannot revoke 'role:update' permission from the last role possessing administrative access",
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.role.update({
        where: { id },
        data: {
          ...(dto.name && { name: dto.name }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.active !== undefined && { active: dto.active }),
        },
      });

      if (targetPermissionIds !== undefined) {
        await tx.rolePermission.deleteMany({
          where: { roleId: id },
        });

        if (targetPermissionIds.length > 0) {
          await tx.rolePermission.createMany({
            data: targetPermissionIds.map((permissionId) => ({
              roleId: id,
              permissionId,
            })),
          });
        }
      }

      return this.findOne(id);
    });
  }

  async remove(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true } },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID "${id}" not found`);
    }

    if (role._count.users > 0) {
      throw new ConflictException(
        `Cannot delete role "${role.name}" because it is currently assigned to ${role._count.users} active user(s)`,
      );
    }

    const isRoleUpdateRevoked = await this.wouldRevokeRoleUpdate(id, []);
    if (isRoleUpdateRevoked) {
      throw new BadRequestException(
        "Cannot delete the last remaining role that possesses 'role:update' permission",
      );
    }

    await this.prisma.role.delete({
      where: { id },
    });

    return { message: `Role "${role.name}" successfully deleted` };
  }

  private async wouldRevokeRoleUpdate(
    roleIdToModify: string,
    newPermissionIdsForRole: string[],
  ): Promise<boolean> {
    const roleUpdatePerm = await this.prisma.permission.findUnique({
      where: { name: "role:update" },
    });

    if (!roleUpdatePerm) {
      return false;
    }

    // Find all active roles that currently have role:update
    const activeRolesWithPermission = await this.prisma.role.findMany({
      where: {
        active: true,
        permissions: {
          some: { permissionId: roleUpdatePerm.id },
        },
      },
      select: { id: true },
    });

    const otherRoleIds = activeRolesWithPermission
      .map((r) => r.id)
      .filter((id) => id !== roleIdToModify);

    const willCurrentRoleHaveIt = newPermissionIdsForRole.includes(
      roleUpdatePerm.id,
    );

    return otherRoleIds.length === 0 && !willCurrentRoleHaveIt;
  }
}
