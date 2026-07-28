import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

export interface ApiResponseEnvelope<T = any> {
  success: boolean;
  message: string | null;
  data: T | null;
  meta?: any;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponseEnvelope<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponseEnvelope<T>> {
    return next.handle().pipe(
      map((res) => {
        if (
          res &&
          typeof res === "object" &&
          "success" in res &&
          "timestamp" in res
        ) {
          return res;
        }

        let message: string | null = null;
        let data: any = res;
        let meta: any = undefined;

        if (res && typeof res === "object" && !Array.isArray(res)) {
          if ("message" in res && typeof res.message === "string") {
            message = res.message;
          }

          if ("meta" in res) {
            meta = res.meta;
          }

          if ("data" in res) {
            data = res.data;
          } else if ("message" in res) {
            const { message: _, meta: __, ...rest } = res;
            data = Object.keys(rest).length > 0 ? rest : null;
          }
        }

        const envelope: ApiResponseEnvelope = {
          success: true,
          message: message ?? "Operation completed successfully",
          data: data ?? null,
          timestamp: new Date().toISOString(),
        };

        if (meta !== undefined) {
          envelope.meta = meta;
        }

        return envelope;
      }),
    );
  }
}
