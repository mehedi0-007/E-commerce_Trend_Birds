import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Permissions } from "../common/decorators/permissions.decorator";
import { CategoriesService } from "./categories.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@ApiTags("Categories Taxonomy")
@ApiBearerAuth()
@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @Permissions("category:create")
  @ApiOperation({ summary: "Create Category / Subcategory" })
  async create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Get("tree")
  @Permissions("category:read")
  @ApiOperation({ summary: "Get Visual Nested Category Hierarchy Tree" })
  async findTree() {
    return this.categoriesService.findTree();
  }

  @Get()
  @Permissions("category:read")
  @ApiOperation({ summary: "List Categories (Flat, Paginated & Searchable)" })
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
  @ApiOperation({ summary: "Get Category Details" })
  async findOne(@Param("id") id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(":id")
  @Permissions("category:update")
  @ApiOperation({ summary: "Update Category" })
  async update(@Param("id") id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(":id")
  @Permissions("category:delete")
  @ApiOperation({ summary: "Delete Category (Guarded if children exist)" })
  async remove(@Param("id") id: string) {
    return this.categoriesService.remove(id);
  }
}
