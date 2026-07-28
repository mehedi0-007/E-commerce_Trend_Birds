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

    let message = "Internal server error";
    let errors: string[] = [];

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === "string") {
        message = res;
        errors = [res];
      } else if (res && typeof res === "object") {
        const resObj = res as Record<string, any>;
        if (Array.isArray(resObj.message)) {
          message = resObj.error || "Validation failed";
          errors = resObj.message;
        } else if (typeof resObj.message === "string") {
          message = resObj.message;
          errors = [resObj.message];
        } else {
          message = exception.message;
          errors = [exception.message];
        }
      } else {
        message = exception.message;
        errors = [exception.message];
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      errors = [exception.message];
    } else {
      errors = [message];
    }

    response.status(status).json({
      success: false,
      message,
      errors,
      data: null,
      timestamp: new Date().toISOString(),
    });
  }
}
