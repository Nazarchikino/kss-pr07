import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import type { Comment } from './comment.model.js';
import type { Ticket } from './ticket.model.js';
import { TicketsRepository } from './tickets.repository.js';
import { TICKETS_SEED } from './tickets.seed.js';

const copy = (t: Ticket): Ticket => ({ ...t, tags: [...t.tags] });

@Injectable()
export class InMemoryTicketsRepository
  extends TicketsRepository
  implements OnModuleInit
{
  private readonly logger = new Logger(InMemoryTicketsRepository.name);
  private items: Ticket[] = [];
  private comments: Comment[] = [];
  private nextId = 1;
  private nextCommentId = 1;

  /** Хук життєвого циклу: викликається після створення модуля, до початку обробки запитів. */
  onModuleInit(): void {
    this.items = TICKETS_SEED.map(copy);
    this.nextId = Math.max(0, ...this.items.map((t) => t.id)) + 1;
    this.logger.log(`Завантажено заявок: ${this.items.length}`);
  }

  async findAll(
    filter: Partial<Pick<Ticket, 'status' | 'authorId'>> = {},
  ): Promise<Ticket[]> {
    return this.items
      .filter(
        (t) =>
          (filter.status === undefined || t.status === filter.status) &&
          (filter.authorId === undefined || t.authorId === filter.authorId),
      )
      .map(copy);
  }

  async findById(id: number): Promise<Ticket | undefined> {
    const found = this.items.find((t) => t.id === id);
    return found ? copy(found) : undefined;
  }

  async create(data: Omit<Ticket, 'id'>): Promise<Ticket> {
    const ticket: Ticket = { ...data, id: this.nextId++ };
    this.items.push(ticket);
    return copy(ticket);
  }

  async update(
    id: number,
    patch: Partial<Omit<Ticket, 'id'>>,
  ): Promise<Ticket | undefined> {
    const index = this.items.findIndex((t) => t.id === id);
    if (index === -1) return undefined;
    this.items[index] = { ...this.items[index], ...patch, id };
    return copy(this.items[index]);
  }

  async remove(id: number): Promise<boolean> {
    const before = this.items.length;
    this.items = this.items.filter((t) => t.id !== id);
    this.comments = this.comments.filter((c) => c.ticketId !== id);
    return this.items.length < before;
  }

  async findComments(ticketId: number): Promise<Comment[]> {
    return this.comments
      .filter((c) => c.ticketId === ticketId)
      .map((c) => ({ ...c }));
  }

  async addComment(data: Omit<Comment, 'id'>): Promise<Comment> {
    const comment: Comment = { ...data, id: this.nextCommentId++ };
    this.comments.push(comment);
    return { ...comment };
  }
}
