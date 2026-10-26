import { IsIn } from 'class-validator';
import { TICKET_STATUSES, type TicketStatus } from '../ticket.model.js';

export class ChangeStatusDto {
  @IsIn(TICKET_STATUSES)
  status: TicketStatus;
}
