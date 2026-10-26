import {
  Injectable,
  Logger,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { performance } from 'node:perf_hooks';
import { tap, type Observable } from 'rxjs';
import type { RequestWithId } from './request-id.middleware.js';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<RequestWithId>();
    const res = http.getResponse<Response>();
    const className = context.getClass().name;
    const handlerName = context.getHandler().name;
    const started = performance.now();

    return next.handle().pipe(
      tap(() => {
        const ms = (performance.now() - started).toFixed(1);
        if (!res.headersSent) {
          res.setHeader('Server-Timing', `app;dur=${ms}`);
        }
        this.logger.log(
          `${req.method} ${req.originalUrl} → ${res.statusCode} ${ms}ms [${className}.${handlerName}] [${req.requestId ?? '-'}]`,
        );
      }),
    );
  }
}
