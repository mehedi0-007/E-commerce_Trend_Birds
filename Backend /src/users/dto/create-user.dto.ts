import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export class CreateUserDto {
  @ApiProperty({ example: "Sarah Connor", description: "Full name of the user" })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: "sarah@example.com", description: "Email address" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "SecurePass123!", description: "Account password" })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: "cms9720bg001g47uo70nuax7s", description: "Target Role ID" })
  @IsString()
  roleId!: string;

  @ApiPropertyOptional({ example: "+1234567890", description: "Contact phone number" })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: "Female", description: "Gender identification" })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ example: "https://example.com/avatar.jpg", description: "Profile picture URL" })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ example: true, description: "Active status flag" })
  @IsOptional()
  @IsBoolean()
  active?: boolean = true;
}
