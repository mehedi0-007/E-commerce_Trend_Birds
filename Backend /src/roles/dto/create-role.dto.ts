import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export class CreateRoleDto {
  @ApiProperty({ example: "Inventory Manager", description: "Name of the role" })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional({ example: "Manages stock levels and catalog items", description: "Role description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: true, description: "Active status" })
  @IsOptional()
  @IsBoolean()
  active?: boolean = true;

  @ApiPropertyOptional({ example: false, description: "Grant unrestricted administrative permissions" })
  @IsOptional()
  @IsBoolean()
  grantAll?: boolean = false;

  @ApiPropertyOptional({
    example: ["cms9720op001i47uo4ndvfjbm"],
    description: "Array of Permission IDs assigned to this role",
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionIds?: string[];
}
