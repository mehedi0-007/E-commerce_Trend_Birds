import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private async isSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
    const existing = await this.prisma.category.findUnique({
      where: { slug },
    });
    if (!existing) return false;
    return existing.id !== excludeId;
  }

  private async willCreateCycle(
    categoryId: string,
    targetParentId: string,
  ): Promise<boolean> {
    if (categoryId === targetParentId) {
      return true;
    }

    let currentParentId: string | null = targetParentId;

    while (currentParentId) {
      if (currentParentId === categoryId) {
        return true;
      }
      const parent: { parentId: string | null } | null =
        await this.prisma.category.findUnique({
          where: { id: currentParentId },
          select: { parentId: true },
        });

      currentParentId = parent ? parent.parentId : null;
    }

    return false;
  }

  async create(dto: CreateCategoryDto) {
    const slug = dto.slug
      ? this.generateSlug(dto.slug)
      : this.generateSlug(dto.name);

    if (await this.isSlugTaken(slug)) {
      throw new ConflictException(`Category with slug "${slug}" already exists`);
    }

    if (dto.parentId) {
      const parentExists = await this.prisma.category.findUnique({
        where: { id: dto.parentId },
      });
      if (!parentExists) {
        throw new NotFoundException(`Parent category with ID "${dto.parentId}" not found`);
      }
    }

    if (dto.imageId) {
      const imageExists = await this.prisma.media.findUnique({
        where: { id: dto.imageId },
      });
      if (!imageExists) {
        throw new NotFoundException(`Media asset with ID "${dto.imageId}" not found`);
      }
    }

    return this.prisma.category.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description || null,
        parentId: dto.parentId || null,
        imageId: dto.imageId || null,
        active: dto.active ?? true,
      },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        image: true,
      },
    });
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    parentId?: string;
    active?: boolean;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { slug: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
    }

    if (query.parentId !== undefined) {
      where.parentId = query.parentId === "null" ? null : query.parentId;
    }

    if (query.active !== undefined) {
      where.active = query.active;
    }

    const [data, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip,
        take: limit,
        include: {
          parent: { select: { id: true, name: true, slug: true } },
          image: true,
          _count: { select: { children: true } },
        },
        orderBy: { name: "asc" },
      }),
      this.prisma.category.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findTree() {
    const fetchTreeNodes = async (parentId: string | null = null): Promise<any[]> => {
      const categories = await this.prisma.category.findMany({
        where: { parentId, active: true },
        include: {
          image: true,
        },
        orderBy: { name: "asc" },
      });

      const result = [];
      for (const cat of categories) {
        const children = await fetchTreeNodes(cat.id);
        result.push({
          ...cat,
          children,
        });
      }
      return result;
    };

    return fetchTreeNodes(null);
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: { select: { id: true, name: true, slug: true, active: true } },
        image: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.findOne(id);

    let newSlug = category.slug;
    if (dto.slug || dto.name) {
      newSlug = dto.slug
        ? this.generateSlug(dto.slug)
        : this.generateSlug(dto.name || category.name);

      if (await this.isSlugTaken(newSlug, id)) {
        throw new ConflictException(`Category with slug "${newSlug}" already exists`);
      }
    }

    if (dto.parentId !== undefined && dto.parentId !== null) {
      if (await this.willCreateCycle(id, dto.parentId)) {
        throw new BadRequestException(
          `Cannot set category "${dto.parentId}" as parent because it would create a circular dependency in the category tree.`,
        );
      }
    }

    if (dto.imageId) {
      const imageExists = await this.prisma.media.findUnique({
        where: { id: dto.imageId },
      });
      if (!imageExists) {
        throw new NotFoundException(`Media asset with ID "${dto.imageId}" not found`);
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(newSlug && { slug: newSlug }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId }),
        ...(dto.imageId !== undefined && { imageId: dto.imageId }),
        ...(dto.active !== undefined && { active: dto.active }),
      },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        image: true,
      },
    });
  }

  async remove(id: string) {
    const category = await this.findOne(id);

    if (category.children && category.children.length > 0) {
      throw new BadRequestException(
        `Cannot delete category "${category.name}" because it has ${category.children.length} child subcategories. Reassign or delete subcategories first.`,
      );
    }

    await this.prisma.category.delete({
      where: { id },
    });

    return { message: `Category "${category.name}" successfully deleted` };
  }
}
