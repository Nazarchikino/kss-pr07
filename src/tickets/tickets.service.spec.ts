// Модульні тести TicketsService (оновлено в практичній роботі № 7). Файл не змінюйте.
// Залежності сервісу замінено тестовими: так видно переваги впровадження залежностей.
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CLOCK } from '../common/clock.js';
import type { User } from '../users/user.model.js';
import { UsersService } from '../users/users.service.js';
import type { Ticket } from './ticket.model.js';
import { TicketsRepository } from './tickets.repository.js';
import { TicketsService } from './tickets.service.js';

describe('TicketsService (модульні тести з підміною залежностей)', () => {
  const fixedNow = new Date('2026-10-01T09:00:00.000Z');
  const student: User = {
    id: 1,
    fullName: 'Здобувач',
    email: 's@college.example.ua',
    role: 'student',
  };
  const teacher: User = {
    id: 2,
    fullName: 'Викладач',
    email: 't@college.example.ua',
    role: 'teacher',
  };
  let service: TicketsService;
  let repo: {
    findAll: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    repo = {
      findAll: vi.fn().mockResolvedValue([]),
      findById: vi.fn().mockResolvedValue(undefined),
      create: vi
        .fn()
        .mockImplementation(async (data: Omit<Ticket, 'id'>) => ({
          id: 100,
          ...data,
        })),
      remove: vi.fn().mockResolvedValue(false),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        TicketsService,
        { provide: TicketsRepository, useValue: repo },
        {
          provide: UsersService,
          useValue: {
            find: (id: number) => (id === 1 ? { id: 1 } : undefined),
          },
        },
        { provide: CLOCK, useValue: { now: () => fixedNow } },
      ],
    }).compile();
    service = moduleRef.get(TicketsService);
  });

  it('create: автор – поточний користувач, час – з CLOCK, стан – open', async () => {
    const t = await service.create({ title: 'Миша', priority: 'low' }, student);
    expect(t).toMatchObject({
      id: 100,
      authorId: 1,
      status: 'open',
      assigneeId: null,
      createdAt: fixedNow.toISOString(),
      updatedAt: fixedNow.toISOString(),
      tags: [],
    });
    expect(repo.create).toHaveBeenCalledTimes(1);
  });

  it('create: критичний пріоритет від здобувача → ForbiddenException, сховище не викликається', async () => {
    await expect(
      service.create({ title: 'Сервер', priority: 'critical' }, student),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repo.create).not.toHaveBeenCalled();
    await expect(
      service.create({ title: 'Сервер', priority: 'critical' }, teacher),
    ).resolves.toMatchObject({ authorId: 2 });
  });

  it('update: чужу заявку змінити не можна → ForbiddenException', async () => {
    repo.findById.mockResolvedValue({ id: 5, authorId: 2 });
    await expect(
      service.update(5, { title: 'Нова назва' }, student),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('findOne: відсутня заявка → NotFoundException', async () => {
    await expect(service.findOne(5)).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.findById).toHaveBeenCalledWith(5);
  });

  it('remove: відсутня заявка → NotFoundException', async () => {
    await expect(service.remove(5)).rejects.toBeInstanceOf(NotFoundException);
  });
});
