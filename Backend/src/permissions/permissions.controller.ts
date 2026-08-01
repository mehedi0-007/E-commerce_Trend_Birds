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
import { CreatePermissionGroupDto } from "./dto/create-permission-group.dto";
import { QueryPermissionDto } from "./dto/query-permission.dto";
import { UpdatePermissionGroupDto } from "./dto/update-permission-group.dto";
import { PermissionsService } from "./permissions.service";

@ApiTags("Permissions")
@ApiBearerAuth()
@Controller("permissions")
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @Permissions("permission:read")
  @ApiOperation({ summary: "List All Permission Groups & Actions" })
  findAll(@Query() query: QueryPermissionDto) {
    return this.permissionsService.findAll(query);
  }

  @Get("groups/:id")
  @Permissions("permission:read")
  @ApiOperation({ summary: "Get Single Permission Group Details" })
  findOneGroup(@Param("id") id: string) {
    return this.permissionsService.findOneGroup(id);
  }

  @Post("groups")
  @Permissions("permission:create")
  @ApiOperation({ summary: "Create Permission Group" })
  createGroup(@Body() dto: CreatePermissionGroupDto) {
    return this.permissionsService.createGroup(dto);
  }

  @Patch("groups/:id")
  @Permissions("permission:update")
  @ApiOperation({ summary: "Update Permission Group" })
  updateGroup(
    @Param("id") id: string,
    @Body() dto: UpdatePermissionGroupDto,
  ) {
    return this.permissionsService.updateGroup(id, dto);
  }

  @Delete(":id")
  @Permissions("permission:delete")
  @ApiOperation({ summary: "Delete Permission" })
  deletePermission(@Param("id") id: string) {
    return this.permissionsService.deletePermission(id);
  }
}
