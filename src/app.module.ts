import {
  Module,
  type MiddlewareConsumer,
  type NestModule,
} from '@nestjs/common';
import { APP_INFO, appInfoFactory } from './app-info.js';
import { AuthModule } from './auth/auth.module.js';
import { RequestIdMiddleware } from './common/http/request-id.middleware.js';
import { HealthController } from './health.controller.js';
import { TicketsModule } from './tickets/tickets.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [UsersModule, AuthModule, TicketsModule],
  controllers: [HealthController],
  providers: [{ provide: APP_INFO, useFactory: appInfoFactory }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*path');
  }
}
