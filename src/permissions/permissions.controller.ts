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
import { CreatePermissionGroupDto } from "./dto/create-permission-group.dto";
import { QueryPermissionDto } from "./dto/query-permission.dto";
import { UpdatePermissionGroupDto } from "./dto/update-permission-group.dto";
import { PermissionsService } from "./permissions.service";

@Controller("permissions")
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @Permissions("permission:read")
  findAll(@Query() query: QueryPermissionDto) {
    return this.permissionsService.findAll(query);
  }

  @Get("groups/:id")
  @Permissions("permission:read")
  findOneGroup(@Param("id") id: string) {
    return this.permissionsService.findOneGroup(id);
  }

  @Post("groups")
  @Permissions("permission:create")
  createGroup(@Body() dto: CreatePermissionGroupDto) {
    return this.permissionsService.createGroup(dto);
  }

  @Put("groups/:id")
  @Permissions("permission:update")
  updateGroup(
    @Param("id") id: string,
    @Body() dto: UpdatePermissionGroupDto,
  ) {
    return this.permissionsService.updateGroup(id, dto);
  }

  @Delete(":id")
  @Permissions("permission:delete")
  deletePermission(@Param("id") id: string) {
    return this.permissionsService.deletePermission(id);
  }
}
