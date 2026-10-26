import {
  Catch,
  HttpException,
  Injectable,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  REQUEST_ID_HEADER,
  type RequestWithId,
} from './request-id.middleware.js';

const PROBLEM_TITLES: Readonly<Record<number, string>> = {
  400: 'Некоректний запит',
  401: 'Необхідна автентифікація',
  403: 'Доступ заборонено',
  404: 'Ресурс не знайдено',
  409: 'Конфлікт стану',
  422: 'Помилка валідації даних',
  500: 'Внутрішня помилка сервера',
  503: 'Сервіс тимчасово недоступний',
};

@Injectable()
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<RequestWithId>();
    const res = ctx.getResponse<Response>();
    const requestId = req.requestId ?? 'unknown';

    let status = 500;
    let detail =
      'Сталася непередбачена помилка. Повідомте ідентифікатор запиту адміністратору.';
    let extensions: Record<string, unknown> = {};

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();

      if (typeof body === 'string') {
        detail = body;
      } else if (typeof body === 'object' && body !== null) {
        const {
          message,
          statusCode: _statusCode,
          error: _error,
          ...rest
        } = body as Record<string, unknown>;

        if (Array.isArray(message)) {
          detail = message.map(String).join('; ');
        } else if (typeof message === 'string') {
          detail = message;
        } else {
          detail = exception.message;
        }
        extensions = rest;
      }

      if (status >= 500) {
        this.logger.error(
          `${req.method} ${req.originalUrl} → ${status} ${detail} [${requestId}]`,
        );
      } else {
        this.logger.warn(
          `${req.method} ${req.originalUrl} → ${status} ${detail} [${requestId}]`,
        );
      }
    } else {
      const errMessage =
        exception instanceof Error ? exception.message : String(exception);
      const errStack =
        exception instanceof Error ? exception.stack : undefined;
      this.logger.error(
        `${req.method} ${req.originalUrl} → 500 ${errMessage} [${requestId}]`,
        errStack,
      );
    }

    if (status === 401) {
      res.setHeader('WWW-Authenticate', 'Bearer realm="helpdesk"');
    }
    if (!res.getHeader(REQUEST_ID_HEADER) && req.requestId) {
      res.setHeader(REQUEST_ID_HEADER, req.requestId);
    }

    const title = PROBLEM_TITLES[status] ?? 'Помилка обробки запиту';

    res
      .status(status)
      .type('application/problem+json')
      .json({
        type: 'about:blank',
        title,
        status,
        detail,
        instance: req.originalUrl,
        requestId,
        ...extensions,
      });
  }
}
