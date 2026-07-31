import { StockStatus } from "@prisma/client";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { CreateProductMediaAttachmentDto } from "./create-product-media-attachment.dto";
import { CreateProductVariantDto } from "./create-product-variant.dto";

export class CreateProductDto {
  @ApiProperty({ example: "Wireless Noise-Canceling Headphones", description: "Product title" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: "wireless-noise-canceling-headphones", description: "URL-friendly slug" })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({ example: "AUDIO-NC-001", description: "Stock Keeping Unit (SKU)" })
  @IsString()
  @IsNotEmpty()
  sku!: string;

  @ApiPropertyOptional({ example: "Premium Bluetooth headphones with 30-hour battery life", description: "Brief product summary" })
  @IsString()
  @IsOptional()
  shortDescription?: string;

  @ApiPropertyOptional({ example: "Experience world-class active noise cancellation with crystal clear audio quality...", description: "Detailed product HTML/text body" })
  @IsString()
  @IsOptional()
  longDescription?: string;

  @ApiPropertyOptional({ example: true, description: "Whether product has multiple variants (e.g. Size/Color)" })
  @IsBoolean()
  @IsOptional()
  hasVariants?: boolean;

  @ApiPropertyOptional({ example: 299.99, description: "Regular retail price" })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ example: 249.99, description: "Discounted promotional price" })
  @IsNumber()
  @Min(0)
  @IsOptional()
  salePrice?: number;

  @ApiPropertyOptional({ example: 150, description: "Stock inventory level" })
  @IsInt()
  @Min(0)
  @IsOptional()
  stock?: number;

  @ApiPropertyOptional({ enum: StockStatus, example: StockStatus.IN_STOCK, description: "Stock status enum" })
  @IsEnum(StockStatus)
  @IsOptional()
  stockStatus?: StockStatus;

  @ApiPropertyOptional({ example: 0.85, description: "Weight in kg" })
  @IsNumber()
  @Min(0)
  @IsOptional()
  weight?: number;

  @ApiPropertyOptional({ example: true, description: "Visibility status" })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiPropertyOptional({ example: true, description: "Featured product flag" })
  @IsBoolean()
  @IsOptional()
  featured?: boolean;

  @ApiPropertyOptional({ example: 0, description: "Display sort ordering" })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ example: "cms9720bg001g47uo70nuax7s", description: "Associated Brand ID" })
  @IsString()
  @IsOptional()
  brandId?: string;

  @ApiPropertyOptional({
    example: ["cms9720op001i47uo4ndvfjbm"],
    description: "Array of Category IDs",
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categoryIds?: string[];

  @ApiPropertyOptional({
    description: "Media gallery attachments",
    type: [CreateProductMediaAttachmentDto],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateProductMediaAttachmentDto)
  mediaAttachments?: CreateProductMediaAttachmentDto[];

  @ApiPropertyOptional({
    description: "Product variant combinations",
    type: [CreateProductVariantDto],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantDto)
  variants?: CreateProductVariantDto[];
}
