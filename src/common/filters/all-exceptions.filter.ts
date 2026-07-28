import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { Response } from "express";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | null = "Internal server error";
    let errorDetail: any = "Internal server error";

    const isPrismaError =
      exception instanceof Prisma.PrismaClientKnownRequestError ||
      exception instanceof Prisma.PrismaClientUnknownRequestError ||
      exception instanceof Prisma.PrismaClientRustPanicError ||
      exception instanceof Prisma.PrismaClientInitializationError ||
      exception instanceof Prisma.PrismaClientValidationError;

    if (isPrismaError) {
      this.logger.error("Database Exception Caught:", exception);
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = "Internal server error";
      errorDetail = "Internal server error";
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === "string") {
        message = res;
        errorDetail = res;
      } else if (res && typeof res === "object") {
        const resObj = res as Record<string, any>;
        if (Array.isArray(resObj.message)) {
          message = resObj.error || "Validation failed";
          errorDetail = resObj.message;
        } else if (typeof resObj.message === "string") {
          message = resObj.message;
          errorDetail = resObj.message;
        } else {
          message = exception.message;
          errorDetail = resObj;
        }
      }
    } else if (exception instanceof Error) {
      this.logger.error("Unhandled Exception Caught:", exception);
      message = "Internal server error";
      errorDetail = "Internal server error";
    }

    response.status(status).json({
      success: false,
      message: message ?? "An error occurred",
      error: errorDetail,
      data: null,
      timestamp: new Date().toISOString(),
    });
  }
}
