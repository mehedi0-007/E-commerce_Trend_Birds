import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { Permissions } from "../common/decorators/permissions.decorator";
import { BrandsService } from "./brands.service";
import { CreateBrandDto } from "./dto/create-brand.dto";
import { UpdateBrandDto } from "./dto/update-brand.dto";

@Controller("brands")
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Post()
  @Permissions("brand:create")
  async create(@Body() dto: CreateBrandDto) {
    return this.brandsService.create(dto);
  }

  @Get()
  @Permissions("brand:read")
  async findAll(
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("search") search?: string,
    @Query("active") active?: boolean,
  ) {
    return this.brandsService.findAll({ page, limit, search, active });
  }

  @Get(":id")
  @Permissions("brand:read")
  async findOne(@Param("id") id: string) {
    return this.brandsService.findOne(id);
  }

  @Put(":id")
  @Permissions("brand:update")
  async update(@Param("id") id: string, @Body() dto: UpdateBrandDto) {
    return this.brandsService.update(id, dto);
  }

  @Delete(":id")
  @Permissions("brand:delete")
  async remove(@Param("id") id: string) {
    return this.brandsService.remove(id);
  }
}
