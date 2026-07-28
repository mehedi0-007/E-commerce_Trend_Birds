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
import { CategoriesService } from "./categories.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @Permissions("category:create")
  async create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Get("tree")
  @Permissions("category:read")
  async findTree() {
    return this.categoriesService.findTree();
  }

  @Get()
  @Permissions("category:read")
  async findAll(
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("search") search?: string,
    @Query("parentId") parentId?: string,
    @Query("active") active?: boolean,
  ) {
    return this.categoriesService.findAll({ page, limit, search, parentId, active });
  }

  @Get(":id")
  @Permissions("category:read")
  async findOne(@Param("id") id: string) {
    return this.categoriesService.findOne(id);
  }

  @Put(":id")
  @Permissions("category:update")
  async update(@Param("id") id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(":id")
  @Permissions("category:delete")
  async remove(@Param("id") id: string) {
    return this.categoriesService.remove(id);
  }
}
