import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from "@nestjs/swagger";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AuthenticatedUser } from "../common/interfaces/authenticated-user.interface";
import { Permissions } from "../common/decorators/permissions.decorator";
import { UpdateMediaDto } from "./dto/update-media.dto";
import { MediaService } from "./media.service";

@ApiTags("Media Library")
@ApiBearerAuth()
@Controller("media")
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post("upload")
  @Permissions("media:create")
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Upload Single Media File with Thumbnail Generation" })
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
    @Body("altText") altText?: string,
    @Body("title") title?: string,
  ) {
    return this.mediaService.processAndSaveFile(file, altText, title, user.id);
  }

  @Post("upload-multiple")
  @Permissions("media:create")
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Upload Multiple Media Files in Batch" })
  @UseInterceptors(FilesInterceptor("files", 10))
  async uploadMultipleFiles(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    return this.mediaService.uploadMultiple(files, user.id);
  }

  @Get()
  @Permissions("media:read")
  @ApiOperation({ summary: "List Media Assets (Paginated & Filterable)" })
  async findAll(
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("search") search?: string,
    @Query("mimeType") mimeType?: string,
  ) {
    return this.mediaService.findAll({ page, limit, search, mimeType });
  }

  @Get(":id")
  @Permissions("media:read")
  @ApiOperation({ summary: "Get Single Media Asset Details" })
  async findOne(@Param("id") id: string) {
    return this.mediaService.findOne(id);
  }

  @Put(":id")
  @Permissions("media:update")
  @ApiOperation({ summary: "Update Media Asset Metadata (Alt Text, Title)" })
  async update(@Param("id") id: string, @Body() dto: UpdateMediaDto) {
    return this.mediaService.update(id, dto);
  }

  @Delete(":id")
  @Permissions("media:delete")
  @ApiOperation({ summary: "Delete Media Asset" })
  async remove(@Param("id") id: string) {
    return this.mediaService.remove(id);
  }
}
