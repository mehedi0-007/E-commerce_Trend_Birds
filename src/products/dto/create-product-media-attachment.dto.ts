import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";

export class CreateProductMediaAttachmentDto {
  @IsString()
  @IsNotEmpty()
  mediaId!: string;

  @IsBoolean()
  @IsOptional()
  isThumbnail?: boolean;

  @IsBoolean()
  @IsOptional()
  isGallery?: boolean;

  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @IsString()
  @IsOptional()
  attributeValueId?: string;
}
