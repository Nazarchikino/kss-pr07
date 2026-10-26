import { Injectable, NotFoundException } from '@nestjs/common';
import type { User } from './user.model.js';
import { USERS_SEED } from './users.seed.js';

@Injectable()
export class UsersService {
  private readonly users: User[] = USERS_SEED.map((u) => ({ ...u }));

  findAll(): User[] {
    return this.users.map((u) => ({ ...u }));
  }

  /** Повертає користувача або undefined – для перевірок в інших модулях. */
  find(id: number): User | undefined {
    const user = this.users.find((u) => u.id === id);
    return user ? { ...user } : undefined;
  }

  /** Повертає користувача або кидає 404 – для контролера. */
  findOne(id: number): User {
    const user = this.find(id);
    if (!user)
      throw new NotFoundException(`Користувача з id=${id} не знайдено`);
    return user;
  }
}
