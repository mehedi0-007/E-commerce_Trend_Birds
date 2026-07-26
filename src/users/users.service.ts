import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { hash } from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { QueryUserDto } from "./dto/query-user.dto";
import { UpdateUserStatusDto } from "./dto/update-user-status.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

const USER_SELECT_FIELDS = {
  id: true,
  name: true,
  email: true,
  phone: true,
  gender: true,
  avatar: true,
  active: true,
  roleId: true,
  role: {
    select: {
      id: true,
      name: true,
      description: true,
      active: true,
    },
  },
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryUserDto) {
    const { search, roleId, active, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
    if (roleId) {
      where.roleId = roleId;
    }
    if (active !== undefined) {
      where.active = active;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: USER_SELECT_FIELDS,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        ...USER_SELECT_FIELDS,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
            active: true,
            permissions: {
              select: {
                permission: {
                  select: { id: true, name: true, description: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    const permissions = user.role.permissions.map((p) => p.permission);
    const { permissions: _, ...roleWithoutPermissions } = user.role;

    return {
      ...user,
      role: roleWithoutPermissions,
      permissions,
    };
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException(`User with email "${dto.email}" already exists`);
    }

    const role = await this.prisma.role.findUnique({
      where: { id: dto.roleId },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID "${dto.roleId}" not found`);
    }

    const passwordHash = await hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email.toLowerCase(),
        passwordHash,
        roleId: dto.roleId,
        phone: dto.phone,
        gender: dto.gender,
        avatar: dto.avatar,
        active: dto.active ?? true,
      },
      select: USER_SELECT_FIELDS,
    });

    return user;
  }

  async update(id: string, dto: UpdateUserDto, currentUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    // Self-escalation protection
    if (id === currentUserId) {
      if (
        (dto.roleId !== undefined && dto.roleId !== user.roleId) ||
        (dto.active !== undefined && dto.active !== user.active)
      ) {
        throw new ForbiddenException(
          "Users are not permitted to modify their own role or account active status",
        );
      }
    }

    if (dto.email && dto.email.toLowerCase() !== user.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase() },
      });
      if (existing) {
        throw new ConflictException(
          `User with email "${dto.email}" already exists`,
        );
      }
    }

    if (dto.roleId && dto.roleId !== user.roleId) {
      const role = await this.prisma.role.findUnique({
        where: { id: dto.roleId },
      });
      if (!role) {
        throw new NotFoundException(`Role with ID "${dto.roleId}" not found`);
      }
    }

    let passwordHash: string | undefined = undefined;
    if (dto.password) {
      passwordHash = await hash(dto.password, 12);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.email && { email: dto.email.toLowerCase() }),
        ...(passwordHash && { passwordHash }),
        ...(dto.roleId && { roleId: dto.roleId }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.gender !== undefined && { gender: dto.gender }),
        ...(dto.avatar !== undefined && { avatar: dto.avatar }),
        ...(dto.active !== undefined && { active: dto.active }),
      },
      select: USER_SELECT_FIELDS,
    });

    return updated;
  }

  async updateStatus(
    id: string,
    dto: UpdateUserStatusDto,
    currentUserId: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    if (id === currentUserId) {
      throw new ForbiddenException(
        "Users are not permitted to deactivate their own account status",
      );
    }

    return this.prisma.user.update({
      where: { id },
      data: { active: dto.active },
      select: USER_SELECT_FIELDS,
    });
  }

  async remove(id: string, currentUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    if (id === currentUserId) {
      throw new ForbiddenException(
        "Users are not permitted to delete their own account",
      );
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: `User "${user.name || user.email}" successfully deleted` };
  }
}
