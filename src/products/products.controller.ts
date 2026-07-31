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
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Permissions } from "../common/decorators/permissions.decorator";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ProductsService } from "./products.service";

@ApiTags("Products Engine")
@ApiBearerAuth()
@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Permissions("product:create")
  @ApiOperation({ summary: "Create Product (Supports Variants, Media & Taxonomy)" })
  async create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Get()
  @Permissions("product:read")
  @ApiOperation({ summary: "List Products (Paginated, Search & Filterable)" })
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
  @ApiOperation({ summary: "Get Full Product Details with Variants & Media" })
  async findOne(@Param("id") id: string) {
    return this.productsService.findOne(id);
  }

  @Put(":id")
  @Permissions("product:update")
  @ApiOperation({ summary: "Update Product Details & Variant Combinations" })
  async update(@Param("id") id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(":id")
  @Permissions("product:delete")
  @ApiOperation({ summary: "Delete Product Catalog Item" })
  async remove(@Param("id") id: string) {
    return this.productsService.remove(id);
  }
}
