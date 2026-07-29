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
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ProductsService } from "./products.service";

@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Permissions("product:create")
  async create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Get()
  @Permissions("product:read")
  async findAll(
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("search") search?: string,
    @Query("brandId") brandId?: string,
    @Query("categoryId") categoryId?: string,
    @Query("active") active?: boolean,
    @Query("featured") featured?: boolean,
  ) {
    return this.productsService.findAll({
      page,
      limit,
      search,
      brandId,
      categoryId,
      active,
      featured,
    });
  }

  @Get(":id")
  @Permissions("product:read")
  async findOne(@Param("id") id: string) {
    return this.productsService.findOne(id);
  }

  @Put(":id")
  @Permissions("product:update")
  async update(@Param("id") id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(":id")
  @Permissions("product:delete")
  async remove(@Param("id") id: string) {
    return this.productsService.remove(id);
  }
}
