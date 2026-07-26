import { IsArray, IsOptional, IsString, MinLength } from "class-validator";

export class UpdatePermissionGroupDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  actions?: string[];
}
