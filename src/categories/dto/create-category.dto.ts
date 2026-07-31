import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, IsString, Min } from "class-validator";

export class CreateCategoryDto {
  @ApiProperty({ example: "Audio Devices", description: "Category name" })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: "audio-devices", description: "URL slug" })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: "Headphones, speakers, and audio accessories", description: "Description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: "cms9720op001i47uo4ndvfjbm", description: "Parent category ID for nested subcategories" })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional({ example: "cms9720op001i47uo4ndvfjbm", description: "Associated banner Media asset ID" })
  @IsOptional()
  @IsString()
  imageId?: string;

  @ApiPropertyOptional({ example: true, description: "Active status flag" })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ example: 1, description: "Display sort order" })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
