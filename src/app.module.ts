import { Module } from '@nestjs/common';
import { APP_INFO, appInfoFactory } from './app-info.js';
import { HealthController } from './health.controller.js';
import { TicketsModule } from './tickets/tickets.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [UsersModule, TicketsModule],
  controllers: [HealthController],
  providers: [{ provide: APP_INFO, useFactory: appInfoFactory }],
})
export class AppModule {}
