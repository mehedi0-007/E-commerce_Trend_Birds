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
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Permissions } from "../common/decorators/permissions.decorator";
import { AuthenticatedUser } from "../common/interfaces/authenticated-user.interface";
import { CreateUserDto } from "./dto/create-user.dto";
import { QueryUserDto } from "./dto/query-user.dto";
import { UpdateUserStatusDto } from "./dto/update-user-status.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions("user:read")
  findAll(@Query() query: QueryUserDto) {
    return this.usersService.findAll(query);
  }

  @Get(":id")
  @Permissions("user:read")
  findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Permissions("user:create")
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Put(":id")
  @Permissions("user:update")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.usersService.update(id, dto, currentUser.id);
  }

  @Patch(":id/status")
  @Permissions("user:update")
  updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.usersService.updateStatus(id, dto, currentUser.id);
  }

  @Delete(":id")
  @Permissions("user:delete")
  remove(
    @Param("id") id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.usersService.remove(id, currentUser.id);
  }
}
