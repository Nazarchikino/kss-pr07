import { Controller, Get, Inject, Query } from '@nestjs/common';
import { APP_INFO, type AppInfo } from './app-info.js';
import { Public } from './auth/public.decorator.js';

@Controller('health')
export class HealthController {
  constructor(@Inject(APP_INFO) private readonly info: AppInfo) {}

  @Public()
  @Get()
  check() {
    return {
      status: 'ok',
      name: this.info.name,
      version: this.info.version,
      uptime: Math.round((Date.now() - this.info.startedAt.getTime()) / 1000),
    };
  }

  /** Тестовий маршрут із затримкою для перевірки TimeoutInterceptor (5000 мс → 503). */
  @Public()
  @Get('slow')
  async slow(@Query('ms') ms?: string) {
    const delayMs = ms !== undefined ? Number(ms) : 5200;
    const safeDelay =
      Number.isFinite(delayMs) && delayMs >= 0
        ? Math.min(delayMs, 10000)
        : 5200;
    await new Promise<void>((resolve) => {
      setTimeout(resolve, safeDelay).unref();
    });
    return { status: 'ok', delayedMs: safeDelay };
  }
}
