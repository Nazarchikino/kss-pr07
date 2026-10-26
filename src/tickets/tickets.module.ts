import { Module } from '@nestjs/common';
import { CLOCK, systemClock } from '../common/clock.js';
import { UsersModule } from '../users/users.module.js';
import { InMemoryTicketsRepository } from './in-memory-tickets.repository.js';
import { TicketsController } from './tickets.controller.js';
import { TicketsRepository } from './tickets.repository.js';
import { TicketsService } from './tickets.service.js';

@Module({
  imports: [UsersModule],
  controllers: [TicketsController],
  providers: [
    TicketsService,
    { provide: TicketsRepository, useClass: InMemoryTicketsRepository },
    { provide: CLOCK, useValue: systemClock },
  ],
})
export class TicketsModule {}
