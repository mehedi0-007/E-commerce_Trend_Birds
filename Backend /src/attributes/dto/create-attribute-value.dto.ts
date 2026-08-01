import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateAttributeValueDto {
  @ApiProperty({ example: "Midnight Black", description: "Attribute value label" })
  @IsString()
  @IsNotEmpty()
  value!: string;

  @ApiPropertyOptional({ example: "midnight-black", description: "URL slug" })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ example: "#000000", description: "Reference value (HEX color code or image path)" })
  @IsString()
  @IsOptional()
  referenceValue?: string;
}
