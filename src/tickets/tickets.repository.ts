import type { Comment } from './comment.model.js';
import type { Ticket } from './ticket.model.js';

/**
 * Абстракція сховища заявок. Абстрактний клас (а не інтерфейс) існує під час виконання,
 * тому може бути токеном впровадження. У розділі 4 з’явиться реалізація на Prisma.
 */
export abstract class TicketsRepository {
  abstract findAll(
    filter?: Partial<Pick<Ticket, 'status' | 'authorId'>>,
  ): Promise<Ticket[]>;
  abstract findById(id: number): Promise<Ticket | undefined>;
  abstract create(data: Omit<Ticket, 'id'>): Promise<Ticket>;
  abstract update(
    id: number,
    patch: Partial<Omit<Ticket, 'id'>>,
  ): Promise<Ticket | undefined>;
  abstract remove(id: number): Promise<boolean>;
  abstract findComments(ticketId: number): Promise<Comment[]>;
  abstract addComment(data: Omit<Comment, 'id'>): Promise<Comment>;
}
