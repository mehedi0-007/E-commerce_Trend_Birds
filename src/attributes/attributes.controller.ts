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
import { AttributesService } from "./attributes.service";
import { CreateAttributeValueDto } from "./dto/create-attribute-value.dto";
import { CreateAttributeDto } from "./dto/create-attribute.dto";
import { UpdateAttributeDto } from "./dto/update-attribute.dto";

@ApiTags("Attributes & Options")
@ApiBearerAuth()
@Controller("attributes")
export class AttributesController {
  constructor(private readonly attributesService: AttributesService) {}

  @Post()
  @Permissions("attribute:create")
  @ApiOperation({ summary: "Create Attribute Definition (e.g. Color, Size)" })
  async create(@Body() dto: CreateAttributeDto) {
    return this.attributesService.create(dto);
  }

  @Post(":id/values")
  @Permissions("attribute:create")
  @ApiOperation({ summary: "Add Attribute Values / Swatches" })
  async addValues(
    @Param("id") id: string,
    @Body() dto: CreateAttributeValueDto | CreateAttributeValueDto[],
  ) {
    const valuesArray = Array.isArray(dto) ? dto : [dto];
    return this.attributesService.addValues(id, valuesArray);
  }

  @Get()
  @Permissions("attribute:read")
  @ApiOperation({ summary: "List Attributes with Values" })
  async findAll(
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("search") search?: string,
  ) {
    return this.attributesService.findAll({ page, limit, search });
  }

  @Get(":id")
  @Permissions("attribute:read")
  @ApiOperation({ summary: "Get Attribute Details & Values" })
  async findOne(@Param("id") id: string) {
    return this.attributesService.findOne(id);
  }

  @Put(":id")
  @Permissions("attribute:update")
  @ApiOperation({ summary: "Update Attribute Definition" })
  async update(@Param("id") id: string, @Body() dto: UpdateAttributeDto) {
    return this.attributesService.update(id, dto);
  }

  @Delete("values/:valueId")
  @Permissions("attribute:delete")
  @ApiOperation({ summary: "Delete Specific Attribute Value" })
  async removeValue(@Param("valueId") valueId: string) {
    return this.attributesService.removeValue(valueId);
  }

  @Delete(":id")
  @Permissions("attribute:delete")
  @ApiOperation({ summary: "Delete Attribute & All Associated Values" })
  async remove(@Param("id") id: string) {
    return this.attributesService.remove(id);
  }
}
