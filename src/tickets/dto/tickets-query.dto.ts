import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PageQueryDto } from '../../common/page.js';
import {
  PRIORITIES,
  TICKET_STATUSES,
  type Priority,
  type TicketStatus,
} from '../ticket.model.js';

export const TICKET_SORTS = [
  'createdAt',
  '-createdAt',
  'priority',
  '-priority',
] as const;
export type TicketSort = (typeof TICKET_SORTS)[number];

export class TicketsQueryDto extends PageQueryDto {
  @IsOptional()
  @IsIn(TICKET_STATUSES)
  status?: TicketStatus;

  @IsOptional()
  @IsIn(PRIORITIES)
  priority?: Priority;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  authorId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  assigneeId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsIn(TICKET_SORTS)
  sort: TicketSort = '-createdAt';
}
