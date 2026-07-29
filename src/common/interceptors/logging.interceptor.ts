import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { Request, Response } from "express";
import { Observable, throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger("HTTP");

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const { method, originalUrl } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const { statusCode } = response;
        const duration = Date.now() - startTime;
        this.logger.log(`- ${method} ${originalUrl} ${statusCode} ${duration}ms`);
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const statusCode = error.status || error.statusCode || response.statusCode || 500;
        this.logger.warn(`- ${method} ${originalUrl} ${statusCode} ${duration}ms`);
        return throwError(() => error);
      }),
    );
  }
}
