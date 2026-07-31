import { AttributeType } from "@prisma/client";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { CreateAttributeValueDto } from "./create-attribute-value.dto";

export class CreateAttributeDto {
  @ApiProperty({ example: "Color", description: "Attribute group name" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: "color", description: "URL slug" })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ enum: AttributeType, example: AttributeType.colour_swatch, description: "Attribute display type" })
  @IsEnum(AttributeType)
  @IsOptional()
  type?: AttributeType;

  @ApiPropertyOptional({
    description: "Initial list of attribute values",
    type: [CreateAttributeValueDto],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateAttributeValueDto)
  values?: CreateAttributeValueDto[];
}
