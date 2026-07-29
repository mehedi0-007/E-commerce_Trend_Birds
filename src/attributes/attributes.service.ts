import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAttributeValueDto } from "./dto/create-attribute-value.dto";
import { CreateAttributeDto } from "./dto/create-attribute.dto";
import { UpdateAttributeDto } from "./dto/update-attribute.dto";

@Injectable()
export class AttributesService {
  constructor(private readonly prisma: PrismaService) {}

  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/[\s-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async create(dto: CreateAttributeDto) {
    const slug = dto.slug
      ? this.generateSlug(dto.slug)
      : this.generateSlug(dto.name);

    const existingName = await this.prisma.attribute.findUnique({
      where: { name: dto.name },
    });
    if (existingName) {
      throw new ConflictException(`Attribute with name "${dto.name}" already exists`);
    }

    const existingSlug = await this.prisma.attribute.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      throw new ConflictException(`Attribute with slug "${slug}" already exists`);
    }

    return this.prisma.$transaction(async (tx) => {
      const attribute = await tx.attribute.create({
        data: {
          name: dto.name,
          slug,
          type: dto.type || "dropdown",
        },
      });

      if (dto.values && dto.values.length > 0) {
        for (const val of dto.values) {
          const valSlug = val.slug
            ? this.generateSlug(val.slug)
            : this.generateSlug(val.value);

          await tx.attributeValue.create({
            data: {
              attributeId: attribute.id,
              value: val.value,
              slug: valSlug,
              referenceValue: val.referenceValue || null,
            },
          });
        }
      }

      return tx.attribute.findUnique({
        where: { id: attribute.id },
        include: { values: true },
      });
    });
  }

  async addValues(attributeId: string, valuesDto: CreateAttributeValueDto[]) {
    const attribute = await this.findOne(attributeId);

    const createdValues = [];
    for (const val of valuesDto) {
      const valSlug = val.slug
        ? this.generateSlug(val.slug)
        : this.generateSlug(val.value);

      const existingVal = await this.prisma.attributeValue.findFirst({
        where: {
          attributeId,
          OR: [{ value: val.value }, { slug: valSlug }],
        },
      });

      if (existingVal) {
        throw new ConflictException(
          `Value "${val.value}" already exists for attribute "${attribute.name}"`,
        );
      }

      const newVal = await this.prisma.attributeValue.create({
        data: {
          attributeId,
          value: val.value,
          slug: valSlug,
          referenceValue: val.referenceValue || null,
        },
      });
      createdValues.push(newVal);
    }

    return createdValues;
  }

  async findAll(query: { page?: number; limit?: number; search?: string }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { slug: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.attribute.findMany({
        where,
        skip,
        take: limit,
        include: { values: true },
        orderBy: { name: "asc" },
      }),
      this.prisma.attribute.count({ where }),
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
    const attribute = await this.prisma.attribute.findUnique({
      where: { id },
      include: { values: true },
    });

    if (!attribute) {
      throw new NotFoundException(`Attribute with ID "${id}" not found`);
    }

    return attribute;
  }

  async update(id: string, dto: UpdateAttributeDto) {
    const attribute = await this.findOne(id);

    if (dto.name && dto.name !== attribute.name) {
      const existing = await this.prisma.attribute.findUnique({
        where: { name: dto.name },
      });
      if (existing) {
        throw new ConflictException(`Attribute with name "${dto.name}" already exists`);
      }
    }

    let newSlug = attribute.slug;
    if (dto.slug || (dto.name && dto.name !== attribute.name)) {
      newSlug = dto.slug
        ? this.generateSlug(dto.slug)
        : this.generateSlug(dto.name!);

      const existingSlug = await this.prisma.attribute.findUnique({
        where: { slug: newSlug },
      });
      if (existingSlug && existingSlug.id !== id) {
        throw new ConflictException(`Attribute with slug "${newSlug}" already exists`);
      }
    }

    return this.prisma.attribute.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        slug: newSlug,
        ...(dto.type && { type: dto.type }),
      },
      include: { values: true },
    });
  }

  async remove(id: string) {
    const attribute = await this.findOne(id);

    const valueIds = attribute.values.map((v) => v.id);
    if (valueIds.length > 0) {
      const usedInVariants = await this.prisma.productVariantAttribute.findFirst({
        where: { attributeValueId: { in: valueIds } },
      });

      if (usedInVariants) {
        throw new ConflictException(
          `Cannot delete attribute "${attribute.name}" because one or more of its values are assigned to product variants`,
        );
      }
    }

    await this.prisma.attribute.delete({
      where: { id },
    });

    return { message: `Attribute "${attribute.name}" successfully deleted` };
  }

  async removeValue(valueId: string) {
    const value = await this.prisma.attributeValue.findUnique({
      where: { id: valueId },
    });

    if (!value) {
      throw new NotFoundException(`Attribute value with ID "${valueId}" not found`);
    }

    const usedInVariants = await this.prisma.productVariantAttribute.findFirst({
      where: { attributeValueId: valueId },
    });

    if (usedInVariants) {
      throw new ConflictException(
        `Cannot delete attribute value "${value.value}" because it is assigned to one or more product variants`,
      );
    }

    await this.prisma.attributeValue.delete({
      where: { id: valueId },
    });

    return { message: `Attribute value "${value.value}" successfully deleted` };
  }
}
