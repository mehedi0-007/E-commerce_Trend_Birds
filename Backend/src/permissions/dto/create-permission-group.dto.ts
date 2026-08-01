import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsOptional, IsString, MinLength } from "class-validator";

export class CreatePermissionGroupDto {
  @ApiProperty({ example: "Warehouse", description: "Permission module name" })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional({ example: "Warehouse and fulfillment management", description: "Module description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: ["watch", "read", "create", "update", "delete"],
    description: "Array of actions available in this permission module",
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  actions!: string[];
}
