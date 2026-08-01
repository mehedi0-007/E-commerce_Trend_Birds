import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateBrandDto } from "./dto/create-brand.dto";
import { UpdateBrandDto } from "./dto/update-brand.dto";

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async create(dto: CreateBrandDto) {
    const existingName = await this.prisma.brand.findUnique({
      where: { name: dto.name },
    });
    if (existingName) {
      throw new ConflictException(`Brand with name "${dto.name}" already exists`);
    }

    const slug = dto.slug
      ? this.generateSlug(dto.slug)
      : this.generateSlug(dto.name);

    const existingSlug = await this.prisma.brand.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      throw new ConflictException(`Brand with slug "${slug}" already exists`);
    }

    if (dto.logoId) {
      const logoExists = await this.prisma.media.findUnique({
        where: { id: dto.logoId },
      });
      if (!logoExists) {
        throw new NotFoundException(`Media asset with ID "${dto.logoId}" not found`);
      }
    }

    return this.prisma.brand.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description || null,
        logoId: dto.logoId || null,
        active: dto.active ?? true,
      },
      include: { logo: true },
    });
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
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

    if (query.active !== undefined) {
      where.active = query.active;
    }

    const [data, total] = await Promise.all([
      this.prisma.brand.findMany({
        where,
        skip,
        take: limit,
        include: { logo: true },
        orderBy: { name: "asc" },
      }),
      this.prisma.brand.count({ where }),
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

  async findOne(id: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
      include: { logo: true },
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID "${id}" not found`);
    }

    return brand;
  }

  async update(id: string, dto: UpdateBrandDto) {
    const brand = await this.findOne(id);

    if (dto.name && dto.name !== brand.name) {
      const existing = await this.prisma.brand.findUnique({
        where: { name: dto.name },
      });
      if (existing) {
        throw new ConflictException(`Brand with name "${dto.name}" already exists`);
      }
    }

    let newSlug = brand.slug;
    if (dto.slug || (dto.name && dto.name !== brand.name)) {
      newSlug = dto.slug
        ? this.generateSlug(dto.slug)
        : this.generateSlug(dto.name!);

      const existingSlug = await this.prisma.brand.findUnique({
        where: { slug: newSlug },
      });
      if (existingSlug && existingSlug.id !== id) {
        throw new ConflictException(`Brand with slug "${newSlug}" already exists`);
      }
    }

    if (dto.logoId) {
      const logoExists = await this.prisma.media.findUnique({
        where: { id: dto.logoId },
      });
      if (!logoExists) {
        throw new NotFoundException(`Media asset with ID "${dto.logoId}" not found`);
      }
    }

    return this.prisma.brand.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(newSlug && { slug: newSlug }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.logoId !== undefined && { logoId: dto.logoId }),
        ...(dto.active !== undefined && { active: dto.active }),
      },
      include: { logo: true },
    });
  }

  async remove(id: string) {
    const brand = await this.findOne(id);

    const productCount = await this.prisma.product.count({
      where: { brandId: id },
    });

    if (productCount > 0) {
      throw new ConflictException(
        `Cannot delete brand "${brand.name}" because it is currently referenced by ${productCount} product(s)`,
      );
    }

    await this.prisma.brand.delete({
      where: { id },
    });

    return { message: `Brand "${brand.name}" successfully deleted` };
  }
}
