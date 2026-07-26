import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePermissionGroupDto } from "./dto/create-permission-group.dto";
import { QueryPermissionDto } from "./dto/query-permission.dto";
import { UpdatePermissionGroupDto } from "./dto/update-permission-group.dto";

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizePermissionName(groupName: string, action: string): string {
    const cleanGroup = groupName.trim().toLowerCase().replace(/\s+/g, "_");
    const cleanAction = action.trim().toLowerCase().replace(/\s+/g, "_");
    return `${cleanGroup}:${cleanAction}`;
  }

  async findAll(query: QueryPermissionDto) {
    const { search, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            {
              permissions: {
                some: { name: { contains: search, mode: "insensitive" as const } },
              },
            },
          ],
        }
      : {};

    const [groups, total] = await Promise.all([
      this.prisma.permissionGroup.findMany({
        where,
        include: {
          permissions: {
            orderBy: { name: "asc" },
          },
        },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      this.prisma.permissionGroup.count({ where }),
    ]);

    return {
      data: groups,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneGroup(id: string) {
    const group = await this.prisma.permissionGroup.findUnique({
      where: { id },
      include: {
        permissions: {
          orderBy: { name: "asc" },
        },
      },
    });

    if (!group) {
      throw new NotFoundException(`Permission group with ID "${id}" not found`);
    }

    return group;
  }

  async createGroup(dto: CreatePermissionGroupDto) {
    const existingGroup = await this.prisma.permissionGroup.findUnique({
      where: { name: dto.name },
    });

    if (existingGroup) {
      throw new ConflictException(`Permission group "${dto.name}" already exists`);
    }

    const permissionNames = dto.actions.map((action) =>
      this.normalizePermissionName(dto.name, action),
    );

    return this.prisma.$transaction(async (tx) => {
      const group = await tx.permissionGroup.create({
        data: {
          name: dto.name,
          description: dto.description,
        },
      });

      for (let i = 0; i < dto.actions.length; i++) {
        const action = dto.actions[i];
        const normName = permissionNames[i];

        await tx.permission.create({
          data: {
            name: normName,
            description: `${action} action for ${group.name}`,
            groupId: group.id,
          },
        });
      }

      return tx.permissionGroup.findUnique({
        where: { id: group.id },
        include: { permissions: true },
      });
    });
  }

  async updateGroup(id: string, dto: UpdatePermissionGroupDto) {
    const group = await this.findOneGroup(id);

    if (dto.name && dto.name !== group.name) {
      const nameConflict = await this.prisma.permissionGroup.findUnique({
        where: { name: dto.name },
      });
      if (nameConflict) {
        throw new ConflictException(`Permission group "${dto.name}" already exists`);
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedGroupName = dto.name || group.name;

      await tx.permissionGroup.update({
        where: { id },
        data: {
          ...(dto.name && { name: dto.name }),
          ...(dto.description !== undefined && { description: dto.description }),
        },
      });

      if (dto.actions) {
        const existingPermissions = await tx.permission.findMany({
          where: { groupId: id },
        });

        const newNormNames = dto.actions.map((action) =>
          this.normalizePermissionName(updatedGroupName, action),
        );

        // Delete permissions no longer in actions array
        const toDelete = existingPermissions.filter(
          (p) => !newNormNames.includes(p.name),
        );
        for (const p of toDelete) {
          await tx.permission.delete({ where: { id: p.id } });
        }

        // Create new permissions
        for (let i = 0; i < dto.actions.length; i++) {
          const action = dto.actions[i];
          const normName = newNormNames[i];

          const exists = existingPermissions.find((p) => p.name === normName);
          if (!exists) {
            await tx.permission.create({
              data: {
                name: normName,
                description: `${action} action for ${updatedGroupName}`,
                groupId: id,
              },
            });
          }
        }
      }

      return tx.permissionGroup.findUnique({
        where: { id },
        include: { permissions: true },
      });
    });
  }

  async deletePermission(id: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID "${id}" not found`);
    }

    await this.prisma.permission.delete({
      where: { id },
    });

    return { message: `Permission "${permission.name}" successfully deleted` };
  }
}
