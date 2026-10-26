import {
  Injectable,
  ServiceUnavailableException,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import {
  catchError,
  throwError,
  timeout,
  TimeoutError,
  type Observable,
} from 'rxjs';

export const DEFAULT_TIMEOUT_MS = 5000;

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(
      timeout(DEFAULT_TIMEOUT_MS),
      catchError((err: unknown) => {
        if (err instanceof TimeoutError) {
          return throwError(
            () =>
              new ServiceUnavailableException(
                `Час обробки запиту перевищив ${DEFAULT_TIMEOUT_MS} мс`,
              ),
          );
        }
        return throwError(() => err);
      }),
    );
  }
}
