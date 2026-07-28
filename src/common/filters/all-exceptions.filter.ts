import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | null = "Internal server error";
    let errorDetail: any = null;

    if (exception instanceof HttpException) {
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
      } else {
        message = exception.message;
        errorDetail = exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      errorDetail = exception.message;
    } else {
      errorDetail = message;
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
