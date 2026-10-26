import {
  Module,
  type MiddlewareConsumer,
  type NestModule,
} from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { APP_INFO, appInfoFactory } from './app-info.js';
import { AuthModule } from './auth/auth.module.js';
import { LoggingInterceptor } from './common/http/logging.interceptor.js';
import { ProblemDetailsFilter } from './common/http/problem-details.filter.js';
import { RequestIdMiddleware } from './common/http/request-id.middleware.js';
import { HealthController } from './health.controller.js';
import { TicketsModule } from './tickets/tickets.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [UsersModule, AuthModule, TicketsModule],
  controllers: [HealthController],
  providers: [
    { provide: APP_INFO, useFactory: appInfoFactory },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_FILTER, useClass: ProblemDetailsFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*path');
  }
}
