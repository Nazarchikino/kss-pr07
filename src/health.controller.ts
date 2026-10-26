import { Controller, Get, Inject } from '@nestjs/common';
import { APP_INFO, type AppInfo } from './app-info.js';

@Controller('health')
export class HealthController {
  constructor(@Inject(APP_INFO) private readonly info: AppInfo) {}

  @Get()
  check() {
    return {
      status: 'ok',
      name: this.info.name,
      version: this.info.version,
      uptime: Math.round((Date.now() - this.info.startedAt.getTime()) / 1000),
    };
  }
}
