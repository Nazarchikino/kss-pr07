// Допоміжні функції e2e-тестів (практична робота № 7). Файл не змінюйте.
import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';

export const ACCOUNTS = {
  student: { email: 'a.petrenko@college.example.ua', password: 'student123' },
  teacher: { email: 'm.koval@college.example.ua', password: 'teacher123' },
  admin: { email: 'o.shevchuk@college.example.ua', password: 'admin123' },
} as const;

export type Who = keyof typeof ACCOUNTS;

export async function createApp(
  extra: { controllers?: unknown[] } = {},
): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
    controllers: (extra.controllers ?? []) as never[],
  }).compile();
  const app = configureApp(moduleRef.createNestApplication({ logger: false }));
  await app.init();
  return app;
}

/** Виконує вхід і повертає заголовок Authorization. */
export async function authHeader(
  app: INestApplication,
  who: Who,
): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send(ACCOUNTS[who])
    .expect(200);
  return `Bearer ${res.body.accessToken}`;
}

export const fields = (res: request.Response): string[] =>
  (res.body.errors ?? []).map((e: { field: string }) => e.field);
