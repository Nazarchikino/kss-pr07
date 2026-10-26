import type { Priority, TicketStatus } from './ticket.model.js';

/** Допустимі переходи між станами заявки (як у практичній № 2). */
export const STATUS_TRANSITIONS: Readonly<
  Record<TicketStatus, readonly TicketStatus[]>
> = {
  open: ['in_progress', 'closed'],
  in_progress: ['open', 'resolved'],
  resolved: ['closed', 'in_progress'],
  closed: [],
};

export const PRIORITY_WEIGHT: Readonly<Record<Priority, number>> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};
