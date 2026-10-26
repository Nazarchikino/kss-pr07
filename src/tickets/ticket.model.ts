export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type Priority = 'low' | 'medium' | 'high' | 'critical';

export const TICKET_STATUSES: readonly TicketStatus[] = [
  'open',
  'in_progress',
  'resolved',
  'closed',
];
export const PRIORITIES: readonly Priority[] = [
  'low',
  'medium',
  'high',
  'critical',
];

export interface Ticket {
  readonly id: number;
  title: string;
  description?: string;
  status: TicketStatus;
  priority: Priority;
  authorId: number;
  assigneeId: number | null;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}
