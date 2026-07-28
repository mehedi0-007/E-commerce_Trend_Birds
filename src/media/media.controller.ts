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
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { Permissions } from "../common/decorators/permissions.decorator";
import { UpdateMediaDto } from "./dto/update-media.dto";
import { MediaService } from "./media.service";

@Controller("media")
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post("upload")
  @Permissions("media:create")
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body("altText") altText?: string,
    @Body("title") title?: string,
  ) {
    return this.mediaService.processAndSaveFile(file, altText, title);
  }

  @Post("upload-multiple")
  @Permissions("media:create")
  @UseInterceptors(FilesInterceptor("files", 10))
  async uploadMultipleFiles(@UploadedFiles() files: Express.Multer.File[]) {
    return this.mediaService.uploadMultiple(files);
  }

  @Get()
  @Permissions("media:read")
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
  async findOne(@Param("id") id: string) {
    return this.mediaService.findOne(id);
  }

  @Put(":id")
  @Permissions("media:update")
  async update(@Param("id") id: string, @Body() dto: UpdateMediaDto) {
    return this.mediaService.update(id, dto);
  }

  @Delete(":id")
  @Permissions("media:delete")
  async remove(@Param("id") id: string) {
    return this.mediaService.remove(id);
  }
}
