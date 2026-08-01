import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString } from "class-validator";

export class CreateBrandDto {
  @ApiProperty({ example: "Sony", description: "Brand name" })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: "sony", description: "URL slug" })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: "Global consumer electronics and entertainment brand", description: "Brand description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: "cms9720op001i47uo4ndvfjbm", description: "Associated Logo Media asset ID" })
  @IsOptional()
  @IsString()
  logoId?: string;

  @ApiPropertyOptional({ example: true, description: "Active status flag" })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
