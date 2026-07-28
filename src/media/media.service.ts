import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateMediaDto } from "./dto/update-media.dto";
import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

@Injectable()
export class MediaService {
  private readonly uploadDir = path.join(process.cwd(), "uploads");
  private readonly thumbDir = path.join(process.cwd(), "uploads", "thumbnails");

  constructor(private readonly prisma: PrismaService) {
    this.ensureDirectoriesExist();
  }

  private ensureDirectoriesExist() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
    if (!fs.existsSync(this.thumbDir)) {
      fs.mkdirSync(this.thumbDir, { recursive: true });
    }
  }

  async processAndSaveFile(file: Express.Multer.File, altText?: string, title?: string) {
    if (!file) {
      throw new BadRequestException("No file provided");
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type "${file.mimetype}". Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`,
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size exceeds maximum allowed limit of 10MB`,
      );
    }

    const fileExt = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${uuidv4()}${fileExt}`;
    const filePath = path.join(this.uploadDir, uniqueName);

    await fs.promises.writeFile(filePath, file.buffer);

    const fileUrl = `/uploads/${uniqueName}`;
    let thumbnailUrl: string | null = null;

    if (file.mimetype.startsWith("image/") && file.mimetype !== "image/svg+xml") {
      try {
        const thumbName = `thumb-${uniqueName}`;
        const thumbPath = path.join(this.thumbDir, thumbName);

        await sharp(file.buffer)
          .resize(300, 300, { fit: "cover" })
          .toFile(thumbPath);

        thumbnailUrl = `/uploads/thumbnails/${thumbName}`;
      } catch (err) {
        thumbnailUrl = fileUrl;
      }
    }

    return this.prisma.media.create({
      data: {
        originalName: file.originalname,
        fileName: uniqueName,
        mimeType: file.mimetype,
        size: file.size,
        url: fileUrl,
        thumbnailUrl,
        altText: altText || null,
        title: title || file.originalname,
      },
    });
  }

  async uploadMultiple(files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException("No files uploaded");
    }

    const savedMedia = [];
    try {
      for (const file of files) {
        const media = await this.processAndSaveFile(file);
        savedMedia.push(media);
      }
      return savedMedia;
    } catch (error) {
      for (const media of savedMedia) {
        try {
          await this.remove(media.id);
        } catch {
        }
      }
      throw error;
    }
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    mimeType?: string;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { originalName: { contains: query.search, mode: "insensitive" } },
        { title: { contains: query.search, mode: "insensitive" } },
        { altText: { contains: query.search, mode: "insensitive" } },
      ];
    }

    if (query.mimeType) {
      where.mimeType = { startsWith: query.mimeType };
    }

    const [data, total] = await Promise.all([
      this.prisma.media.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.media.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const media = await this.prisma.media.findUnique({
      where: { id },
    });

    if (!media) {
      throw new NotFoundException(`Media asset with ID "${id}" not found`);
    }

    return media;
  }

  async update(id: string, dto: UpdateMediaDto) {
    await this.findOne(id);

    return this.prisma.media.update({
      where: { id },
      data: {
        ...(dto.altText !== undefined && { altText: dto.altText }),
        ...(dto.title !== undefined && { title: dto.title }),
      },
    });
  }

  async remove(id: string) {
    const media = await this.findOne(id);

    await this.prisma.media.delete({
      where: { id },
    });

    const filePath = path.join(this.uploadDir, media.fileName);
    if (fs.existsSync(filePath)) {
      try {
        await fs.promises.unlink(filePath);
      } catch (err) {
      }
    }

    if (media.thumbnailUrl && media.thumbnailUrl.includes("/thumbnails/")) {
      const thumbFileName = path.basename(media.thumbnailUrl);
      const thumbPath = path.join(this.thumbDir, thumbFileName);
      if (fs.existsSync(thumbPath)) {
        try {
          await fs.promises.unlink(thumbPath);
        } catch (err) {
        }
      }
    }

    return { message: `Media asset "${media.originalName}" successfully deleted` };
  }
}
