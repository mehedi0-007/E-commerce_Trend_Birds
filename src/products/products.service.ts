import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/[\s-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async create(dto: CreateProductDto) {
    const hasVariants = Boolean(dto.hasVariants);

    // 1. Simple vs Variable validation
    if (!hasVariants) {
      if (dto.price === undefined || dto.price === null) {
        throw new BadRequestException("Simple product must specify a regular price");
      }
      if (dto.variants && dto.variants.length > 0) {
        throw new BadRequestException("Simple product cannot have variants");
      }
    } else {
      if (dto.price !== undefined || dto.stock !== undefined) {
        throw new BadRequestException(
          "Variable product must not specify root price or stock",
        );
      }
      if (!dto.variants || dto.variants.length === 0) {
        throw new BadRequestException("Variable product must have at least one variant");
      }
    }

    // 2. Price sanity check
    if (dto.salePrice !== undefined && dto.salePrice !== null && dto.price !== undefined) {
      if (dto.salePrice > dto.price) {
        throw new BadRequestException(
          "salePrice cannot be greater than regular price",
        );
      }
    }

    // 3. Slug and SKU uniqueness
    const slug = dto.slug
      ? this.generateSlug(dto.slug)
      : this.generateSlug(dto.name);

    const existingSlug = await this.prisma.product.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      throw new ConflictException(`Product with slug "${slug}" already exists`);
    }

    const existingSku = await this.prisma.product.findUnique({
      where: { sku: dto.sku },
    });
    if (existingSku) {
      throw new ConflictException(`Product with SKU "${dto.sku}" already exists`);
    }

    // Check variant SKUs
    if (hasVariants && dto.variants) {
      const variantSkus = new Set<string>();
      for (const variant of dto.variants) {
        if (variantSkus.has(variant.sku)) {
          throw new BadRequestException(
            `Duplicate variant SKU "${variant.sku}" in request`,
          );
        }
        variantSkus.add(variant.sku);

        if (variant.salePrice !== undefined && variant.salePrice !== null) {
          if (variant.salePrice > variant.price) {
            throw new BadRequestException(
              `Variant SKU "${variant.sku}" salePrice cannot be greater than regular price`,
            );
          }
        }

        const existingVarSku = await this.prisma.productVariant.findUnique({
          where: { sku: variant.sku },
        });
        if (existingVarSku) {
          throw new ConflictException(
            `Product variant with SKU "${variant.sku}" already exists`,
          );
        }
      }

      // Check duplicate attribute combinations
      const comboSet = new Set<string>();
      for (const variant of dto.variants) {
        const comboKey = [...variant.attributeValueIds].sort().join(",");
        if (comboSet.has(comboKey)) {
          throw new BadRequestException(
            `Duplicate variant attribute combination found in request`,
          );
        }
        comboSet.add(comboKey);
      }
    }

    // 4. Validate thumbnail constraint
    if (dto.mediaAttachments) {
      const thumbnails = dto.mediaAttachments.filter((m) => m.isThumbnail);
      if (thumbnails.length > 1) {
        throw new BadRequestException("Product can have at most one thumbnail image");
      }
    }

    // 5. Atomic write transaction
    return this.prisma.$transaction(async (tx) => {
      // Validate Foreign Keys
      if (dto.brandId) {
        const brand = await tx.brand.findUnique({ where: { id: dto.brandId } });
        if (!brand) {
          throw new NotFoundException(`Brand with ID "${dto.brandId}" not found`);
        }
      }

      if (dto.categoryIds && dto.categoryIds.length > 0) {
        for (const catId of dto.categoryIds) {
          const category = await tx.category.findUnique({ where: { id: catId } });
          if (!category) {
            throw new NotFoundException(`Category with ID "${catId}" not found`);
          }
        }
      }

      // Verify attribute value IDs exist
      if (hasVariants && dto.variants) {
        for (const v of dto.variants) {
          for (const valId of v.attributeValueIds) {
            const attrVal = await tx.attributeValue.findUnique({
              where: { id: valId },
            });
            if (!attrVal) {
              throw new NotFoundException(
                `Attribute value with ID "${valId}" not found`,
              );
            }
          }
        }
      }

      // Create Product
      const product = await tx.product.create({
        data: {
          name: dto.name,
          slug,
          sku: dto.sku,
          shortDescription: dto.shortDescription || null,
          longDescription: dto.longDescription || null,
          hasVariants,
          price: !hasVariants ? dto.price : null,
          salePrice: !hasVariants ? dto.salePrice || null : null,
          stock: !hasVariants ? dto.stock ?? 0 : null,
          stockStatus: dto.stockStatus || "IN_STOCK",
          weight: dto.weight || null,
          active: dto.active !== undefined ? dto.active : true,
          featured: dto.featured || false,
          sortOrder: dto.sortOrder || 0,
          brandId: dto.brandId || null,
        },
      });

      // Attach Categories
      if (dto.categoryIds && dto.categoryIds.length > 0) {
        await tx.productCategory.createMany({
          data: dto.categoryIds.map((categoryId) => ({
            productId: product.id,
            categoryId,
          })),
        });
      }

      // Attach Product Media
      if (dto.mediaAttachments && dto.mediaAttachments.length > 0) {
        for (const mediaAtt of dto.mediaAttachments) {
          const mediaExists = await tx.media.findUnique({
            where: { id: mediaAtt.mediaId },
          });
          if (!mediaExists) {
            throw new NotFoundException(
              `Media asset with ID "${mediaAtt.mediaId}" not found`,
            );
          }

          await tx.productMediaAttachment.create({
            data: {
              productId: product.id,
              mediaId: mediaAtt.mediaId,
              isThumbnail: mediaAtt.isThumbnail || false,
              isGallery: mediaAtt.isGallery !== undefined ? mediaAtt.isGallery : true,
              sortOrder: mediaAtt.sortOrder || 0,
            },
          });
        }
      }

      // Create Variants
      if (hasVariants && dto.variants) {
        for (const v of dto.variants) {
          const variant = await tx.productVariant.create({
            data: {
              productId: product.id,
              sku: v.sku,
              price: v.price,
              salePrice: v.salePrice || null,
              stock: v.stock ?? 0,
              stockStatus: v.stockStatus || "IN_STOCK",
              lowStockThreshold: v.lowStockThreshold ?? 5,
              weight: v.weight || null,
              active: v.active !== undefined ? v.active : true,
            },
          });

          // Attach Attribute Values
          for (const valId of v.attributeValueIds) {
            await tx.productVariantAttribute.create({
              data: {
                variantId: variant.id,
                attributeValueId: valId,
              },
            });
          }

          // Attach Variant Media
          if (v.mediaAttachments && v.mediaAttachments.length > 0) {
            for (const mediaAtt of v.mediaAttachments) {
              const mediaExists = await tx.media.findUnique({
                where: { id: mediaAtt.mediaId },
              });
              if (!mediaExists) {
                throw new NotFoundException(
                  `Media asset with ID "${mediaAtt.mediaId}" not found`,
                );
              }

              await tx.productMediaAttachment.create({
                data: {
                  variantId: variant.id,
                  mediaId: mediaAtt.mediaId,
                  isThumbnail: mediaAtt.isThumbnail || false,
                  isGallery: mediaAtt.isGallery !== undefined ? mediaAtt.isGallery : true,
                  sortOrder: mediaAtt.sortOrder || 0,
                },
              });
            }
          }
        }
      }

      return tx.product.findUnique({
        where: { id: product.id },
        include: {
          brand: true,
          categories: { include: { category: true } },
          mediaAttachments: { include: { media: true } },
          variants: {
            include: {
              attributeValues: { include: { attributeValue: true } },
              mediaAttachments: { include: { media: true } },
            },
          },
        },
      });
    });
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    brandId?: string;
    categoryId?: string;
    active?: boolean;
    featured?: boolean;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { slug: { contains: query.search, mode: "insensitive" } },
        { sku: { contains: query.search, mode: "insensitive" } },
      ];
    }

    if (query.brandId) {
      where.brandId = query.brandId;
    }

    if (query.categoryId) {
      where.categories = {
        some: { categoryId: query.categoryId },
      };
    }

    if (query.active !== undefined) {
      where.active = Boolean(query.active);
    }

    if (query.featured !== undefined) {
      where.featured = Boolean(query.featured);
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          brand: true,
          categories: { include: { category: true } },
          mediaAttachments: { include: { media: true } },
          variants: {
            include: {
              attributeValues: { include: { attributeValue: true } },
              mediaAttachments: { include: { media: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.product.count({ where }),
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
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        brand: true,
        categories: { include: { category: true } },
        mediaAttachments: { include: { media: true } },
        variants: {
          include: {
            attributeValues: { include: { attributeValue: true } },
            mediaAttachments: { include: { media: true } },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.findOne(id);

    // Validate price vs salePrice
    const newPrice = dto.price !== undefined ? dto.price : product.price;
    const newSalePrice = dto.salePrice !== undefined ? dto.salePrice : product.salePrice;

    if (newSalePrice !== null && newPrice !== null && newSalePrice > newPrice) {
      throw new BadRequestException("salePrice cannot be greater than regular price");
    }

    // Unique SKU check
    if (dto.sku && dto.sku !== product.sku) {
      const existingSku = await this.prisma.product.findUnique({
        where: { sku: dto.sku },
      });
      if (existingSku) {
        throw new ConflictException(`Product with SKU "${dto.sku}" already exists`);
      }
    }

    // Unique Slug check
    let newSlug = product.slug;
    if (dto.slug || (dto.name && dto.name !== product.name)) {
      newSlug = dto.slug
        ? this.generateSlug(dto.slug)
        : this.generateSlug(dto.name!);

      const existingSlug = await this.prisma.product.findUnique({
        where: { slug: newSlug },
      });
      if (existingSlug && existingSlug.id !== id) {
        throw new ConflictException(`Product with slug "${newSlug}" already exists`);
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // Update basic fields
      await tx.product.update({
        where: { id },
        data: {
          ...(dto.name && { name: dto.name }),
          slug: newSlug,
          ...(dto.sku && { sku: dto.sku }),
          ...(dto.shortDescription !== undefined && { shortDescription: dto.shortDescription }),
          ...(dto.longDescription !== undefined && { longDescription: dto.longDescription }),
          ...(dto.price !== undefined && { price: dto.price }),
          ...(dto.salePrice !== undefined && { salePrice: dto.salePrice }),
          ...(dto.stock !== undefined && { stock: dto.stock }),
          ...(dto.stockStatus && { stockStatus: dto.stockStatus }),
          ...(dto.weight !== undefined && { weight: dto.weight }),
          ...(dto.active !== undefined && { active: dto.active }),
          ...(dto.featured !== undefined && { featured: dto.featured }),
          ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
          ...(dto.brandId !== undefined && { brandId: dto.brandId }),
        },
      });

      // Update Categories if provided
      if (dto.categoryIds !== undefined) {
        await tx.productCategory.deleteMany({ where: { productId: id } });
        if (dto.categoryIds.length > 0) {
          await tx.productCategory.createMany({
            data: dto.categoryIds.map((categoryId) => ({
              productId: id,
              categoryId,
            })),
          });
        }
      }

      return tx.product.findUnique({
        where: { id },
        include: {
          brand: true,
          categories: { include: { category: true } },
          mediaAttachments: { include: { media: true } },
          variants: {
            include: {
              attributeValues: { include: { attributeValue: true } },
              mediaAttachments: { include: { media: true } },
            },
          },
        },
      });
    });
  }

  async remove(id: string) {
    const product = await this.findOne(id);

    await this.prisma.product.delete({
      where: { id },
    });

    return { message: `Product "${product.name}" successfully deleted` };
  }
}
