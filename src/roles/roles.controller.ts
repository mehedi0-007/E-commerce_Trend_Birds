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
import { CreateRoleDto } from "./dto/create-role.dto";
import { QueryRoleDto } from "./dto/query-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { RolesService } from "./roles.service";

@ApiTags("Roles")
@ApiBearerAuth()
@Controller("roles")
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Permissions("role:read")
  @ApiOperation({ summary: "List All System Roles" })
  findAll(@Query() query: QueryRoleDto) {
    return this.rolesService.findAll(query);
  }

  @Get(":id")
  @Permissions("role:read")
  @ApiOperation({ summary: "Get Role Details & Assigned Permissions" })
  findOne(@Param("id") id: string) {
    return this.rolesService.findOne(id);
  }

  @Post()
  @Permissions("role:create")
  @ApiOperation({ summary: "Create Role with Permission Matrix Bindings" })
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Put(":id")
  @Permissions("role:update")
  @ApiOperation({ summary: "Update Role & Permission Matrix Bindings" })
  update(@Param("id") id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(id, dto);
  }

  @Delete(":id")
  @Permissions("role:delete")
  @ApiOperation({ summary: "Delete System Role" })
  remove(@Param("id") id: string) {
    return this.rolesService.remove(id);
  }
}
