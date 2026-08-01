import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class LoginDto {
  @ApiProperty({ example: "admin@example.com", description: "User email address" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "Admin123!", description: "User password (min 8 characters)" })
  @IsString()
  @MinLength(8)
  password!: string;
}
