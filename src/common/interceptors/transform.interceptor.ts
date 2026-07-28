import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

export interface ResponseEnvelope<T> {
  success: boolean;
  message: string;
  data: T | null;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ResponseEnvelope<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseEnvelope<T>> {
    return next.handle().pipe(
      map((res) => {
        // If already in standard envelope format, return as is
        if (
          res &&
          typeof res === "object" &&
          "success" in res &&
          "message" in res &&
          "data" in res
        ) {
          return res;
        }

        let message = "Operation completed successfully";
        let data = res;

        if (res && typeof res === "object" && !Array.isArray(res)) {
          if ("message" in res && typeof res.message === "string") {
            message = res.message;
            const { message: _, ...rest } = res;
            data = Object.keys(rest).length > 0 ? rest : null;
          }
        }

        return {
          success: true,
          message,
          data: data ?? null,
        };
      }),
    );
  }
}
