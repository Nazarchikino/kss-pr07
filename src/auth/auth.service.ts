import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { User } from '../users/user.model.js';
import { UsersService } from '../users/users.service.js';

const TOKEN_TTL_SECONDS = 3600; // 1 година

/** Навчальні паролі облікових записів (у розділі 7 буде замінено хешами в БД). */
const PASSWORDS: Readonly<Record<string, string>> = {
  'a.petrenko@college.example.ua': 'student123',
  'm.koval@college.example.ua': 'teacher123',
  'o.shevchuk@college.example.ua': 'admin123',
};

interface TokenSession {
  userId: number;
  expiresAt: number;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

@Injectable()
export class AuthService {
  private readonly tokens = new Map<string, TokenSession>();

  constructor(private readonly users: UsersService) {}

  login(email: string, password: string): LoginResponse {
    const user = this.users.findByEmail(email);
    if (!user || PASSWORDS[user.email] !== password) {
      throw new UnauthorizedException('Невірний email або пароль');
    }

    const accessToken = randomUUID();
    this.tokens.set(accessToken, {
      userId: user.id,
      expiresAt: Date.now() + TOKEN_TTL_SECONDS * 1000,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: TOKEN_TTL_SECONDS,
    };
  }

  verify(token: string): User {
    const session = this.tokens.get(token);
    if (!session) {
      throw new UnauthorizedException('Недійсний токен автентифікації');
    }
    if (Date.now() > session.expiresAt) {
      this.tokens.delete(token);
      throw new UnauthorizedException('Час дії токена минув');
    }
    const user = this.users.find(session.userId);
    if (!user) {
      throw new UnauthorizedException('Користувача не знайдено');
    }
    return user;
  }
}
