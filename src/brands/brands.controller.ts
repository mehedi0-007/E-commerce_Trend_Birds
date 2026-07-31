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
import { BrandsService } from "./brands.service";
import { CreateBrandDto } from "./dto/create-brand.dto";
import { UpdateBrandDto } from "./dto/update-brand.dto";

@ApiTags("Brands Directory")
@ApiBearerAuth()
@Controller("brands")
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Post()
  @Permissions("brand:create")
  @ApiOperation({ summary: "Create Brand with Optional Logo Association" })
  async create(@Body() dto: CreateBrandDto) {
    return this.brandsService.create(dto);
  }

  @Get()
  @Permissions("brand:read")
  @ApiOperation({ summary: "List Brands (Paginated & Searchable)" })
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
  @ApiOperation({ summary: "Get Brand Details" })
  async findOne(@Param("id") id: string) {
    return this.brandsService.findOne(id);
  }

  @Put(":id")
  @Permissions("brand:update")
  @ApiOperation({ summary: "Update Brand Details" })
  async update(@Param("id") id: string, @Body() dto: UpdateBrandDto) {
    return this.brandsService.update(id, dto);
  }

  @Delete(":id")
  @Permissions("brand:delete")
  @ApiOperation({ summary: "Delete Brand (Guarded if associated with products)" })
  async remove(@Param("id") id: string) {
    return this.brandsService.remove(id);
  }
}
