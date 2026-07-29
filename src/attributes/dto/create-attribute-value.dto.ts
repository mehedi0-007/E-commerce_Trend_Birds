import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateAttributeValueDto {
  @IsString()
  @IsNotEmpty()
  value!: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  referenceValue?: string;
}
