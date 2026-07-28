import { IsBoolean, IsOptional, IsString } from "class-validator";

export class CreateBrandDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  logoId?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
