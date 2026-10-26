import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CLOCK, type Clock } from '../common/clock.js';
import { type Page, PageQueryDto, paginate } from '../common/page.js';
import type { User } from '../users/user.model.js';
import { UsersService } from '../users/users.service.js';
import type { Comment } from './comment.model.js';
import type { CreateCommentDto } from './dto/create-comment.dto.js';
import type { CreateTicketDto } from './dto/create-ticket.dto.js';
import type { TicketsQueryDto } from './dto/tickets-query.dto.js';
import type { UpdateTicketDto } from './dto/update-ticket.dto.js';
import { PRIORITY_WEIGHT, STATUS_TRANSITIONS } from './ticket-status.js';
import type { Ticket, TicketStatus } from './ticket.model.js';
import { TicketsRepository } from './tickets.repository.js';

@Injectable()
export class TicketsService {
  constructor(
    private readonly repo: TicketsRepository,
    private readonly users: UsersService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async findAll(query: TicketsQueryDto): Promise<Page<Ticket>> {
    let items = await this.repo.findAll({
      status: query.status,
      authorId: query.authorId,
    });
    if (query.priority)
      items = items.filter((t) => t.priority === query.priority);
    if (query.assigneeId)
      items = items.filter((t) => t.assigneeId === query.assigneeId);
    if (query.q) {
      const q = query.q.toLowerCase();
      items = items.filter((t) =>
        `${t.title} ${t.description ?? ''}`.toLowerCase().includes(q),
      );
    }
    const desc = query.sort.startsWith('-');
    const byPriority = query.sort === 'priority' || query.sort === '-priority';
    items.sort((a, b) => {
      const diff = byPriority
        ? PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority]
        : a.createdAt.localeCompare(b.createdAt);
      return (desc ? -diff : diff) || a.id - b.id;
    });
    return paginate(items, query.page, query.pageSize);
  }

  async findOne(id: number): Promise<Ticket> {
    const ticket = await this.repo.findById(id);
    if (!ticket) throw new NotFoundException(`Заявку з id=${id} не знайдено`);
    return ticket;
  }

  async create(dto: CreateTicketDto, user: User): Promise<Ticket> {
    if (dto.priority === 'critical' && user.role === 'student') {
      throw new ForbiddenException(
        'Здобувач не може створювати заявки з критичним пріоритетом',
      );
    }
    const now = this.clock.now().toISOString();
    return this.repo.create({
      title: dto.title,
      ...(dto.description ? { description: dto.description } : {}),
      status: 'open',
      priority: dto.priority,
      authorId: user.id,
      assigneeId: null,
      createdAt: now,
      updatedAt: now,
      tags: dto.tags ?? [],
    });
  }

  async update(id: number, dto: UpdateTicketDto, user: User): Promise<Ticket> {
    // Поля класу DTO, яких немає в запиті, мають значення undefined – відкидаємо їх.
    const patch: Partial<Omit<Ticket, 'id'>> = Object.fromEntries(
      Object.entries(dto).filter(([, v]) => v !== undefined),
    );
    if (Object.keys(patch).length === 0) {
      throw new UnprocessableEntityException({
        message: 'Дані не відповідають вимогам',
        errors: [
          { field: '', message: 'передайте хоча б одне поле для оновлення' },
        ],
      });
    }
    const ticket = await this.findOne(id);
    if (user.role !== 'admin' && ticket.authorId !== user.id) {
      throw new ForbiddenException(
        'Редагувати заявку може лише її автор або адміністратор',
      );
    }
    if (dto.assigneeId !== undefined && user.role !== 'admin') {
      throw new ForbiddenException(
        'Призначати виконавця може лише адміністратор',
      );
    }
    if (patch.assigneeId) this.assertUserExists(patch.assigneeId, 'assigneeId');
    const updated = await this.repo.update(id, {
      ...patch,
      updatedAt: this.clock.now().toISOString(),
    });
    if (!updated) throw new NotFoundException(`Заявку з id=${id} не знайдено`);
    return updated;
  }

  async changeStatus(id: number, status: TicketStatus): Promise<Ticket> {
    const ticket = await this.findOne(id);
    const allowed = STATUS_TRANSITIONS[ticket.status];
    if (!allowed.includes(status)) {
      throw new ConflictException({
        message: `Перехід ${ticket.status} → ${status} недопустимий`,
        allowed,
      });
    }
    const updated = await this.repo.update(id, {
      status,
      updatedAt: this.clock.now().toISOString(),
    });
    if (!updated) throw new NotFoundException(`Заявку з id=${id} не знайдено`);
    return updated;
  }

  async remove(id: number): Promise<void> {
    const removed = await this.repo.remove(id);
    if (!removed) throw new NotFoundException(`Заявку з id=${id} не знайдено`);
  }

  async findComments(
    ticketId: number,
    page: PageQueryDto,
  ): Promise<Page<Comment>> {
    await this.findOne(ticketId);
    return paginate(
      await this.repo.findComments(ticketId),
      page.page,
      page.pageSize,
    );
  }

  async findComment(ticketId: number, commentId: number): Promise<Comment> {
    const comment = (await this.repo.findComments(ticketId)).find(
      (c) => c.id === commentId,
    );
    if (!comment)
      throw new NotFoundException(`Коментар з id=${commentId} не знайдено`);
    return comment;
  }

  async addComment(
    ticketId: number,
    dto: CreateCommentDto,
    user: User,
  ): Promise<Comment> {
    await this.findOne(ticketId);
    return this.repo.addComment({
      ticketId,
      authorId: user.id,
      text: dto.text,
      createdAt: this.clock.now().toISOString(),
    });
  }

  private assertUserExists(userId: number, field: string): void {
    if (!this.users.find(userId)) {
      throw new UnprocessableEntityException({
        message: 'Дані не відповідають вимогам',
        errors: [{ field, message: `користувача з id=${userId} не існує` }],
      });
    }
  }
}
