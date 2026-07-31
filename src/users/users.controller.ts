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
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Permissions } from "../common/decorators/permissions.decorator";
import { AuthenticatedUser } from "../common/interfaces/authenticated-user.interface";
import { CreateUserDto } from "./dto/create-user.dto";
import { QueryUserDto } from "./dto/query-user.dto";
import { UpdateUserStatusDto } from "./dto/update-user-status.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersService } from "./users.service";

@ApiTags("Users Management")
@ApiBearerAuth()
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions("user:read")
  @ApiOperation({ summary: "List Users (Paginated & Searchable)" })
  findAll(@Query() query: QueryUserDto) {
    return this.usersService.findAll(query);
  }

  @Get(":id")
  @Permissions("user:read")
  @ApiOperation({ summary: "Get User Details" })
  findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Permissions("user:create")
  @ApiOperation({ summary: "Create User Account & Assign Role" })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Put(":id")
  @Permissions("user:update")
  @ApiOperation({ summary: "Update User Details & Role" })
  update(
    @Param("id") id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.usersService.update(id, dto, currentUser.id);
  }

  @Patch(":id/status")
  @Permissions("user:update")
  @ApiOperation({ summary: "Toggle User Active / Inactive Status" })
  updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.usersService.updateStatus(id, dto, currentUser.id);
  }

  @Delete(":id")
  @Permissions("user:delete")
  @ApiOperation({ summary: "Delete User Account" })
  remove(
    @Param("id") id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.usersService.remove(id, currentUser.id);
  }
}
