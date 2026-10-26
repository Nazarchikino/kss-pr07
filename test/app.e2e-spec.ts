// Наскрізні тести: health, автентифікація, користувачі (оновлено в практичній роботі № 7). Файл не змінюйте.
import { type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { authHeader, createApp } from './helpers.js';

describe('helpdesk-api (e2e): health, auth, users', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;

  beforeEach(async () => {
    app = await createApp();
    http = request(app.getHttpServer());
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /health – публічний: 200, назва і версія з package.json', async () => {
    const res = await http.get('/api/v1/health').expect(200);
    expect(res.body).toMatchObject({ status: 'ok', name: 'helpdesk-api' });
    expect(res.body.version).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('маршрути доступні лише з префіксом /api/v1', async () => {
    await http.get('/health').expect(404);
  });

  it('POST /auth/login: 200 і токен Bearer; неправильний пароль → 401; некоректний email → 422', async () => {
    const ok = await http
      .post('/api/v1/auth/login')
      .send({ email: 'a.petrenko@college.example.ua', password: 'student123' })
      .expect(200);
    expect(ok.body).toMatchObject({ tokenType: 'Bearer', expiresIn: 3600 });
    expect(typeof ok.body.accessToken).toBe('string');
    await http
      .post('/api/v1/auth/login')
      .send({ email: 'a.petrenko@college.example.ua', password: 'wrong-pass' })
      .expect(401);
    await http
      .post('/api/v1/auth/login')
      .send({ email: 'not-an-email', password: 'student123' })
      .expect(422);
  });

  it('GET /users/me повертає власника токена', async () => {
    const teacherAuth = await authHeader(app, 'teacher');
    const res = await http
      .get('/api/v1/users/me')
      .set('Authorization', teacherAuth)
      .expect(200);
    expect(res.body).toMatchObject({ id: 2, role: 'teacher' });
  });

  it('GET /users – лише адміністратор (403 для здобувача)', async () => {
    const studentAuth = await authHeader(app, 'student');
    await http
      .get('/api/v1/users')
      .set('Authorization', studentAuth)
      .expect(403);
    const adminAuth = await authHeader(app, 'admin');
    const res = await http
      .get('/api/v1/users')
      .set('Authorization', adminAuth)
      .expect(200);
    expect(res.body).toHaveLength(3);
  });

  it('GET /users/{userId}: 200; 404; 400 для 0 і abc', async () => {
    const auth = await authHeader(app, 'student');
    await http.get('/api/v1/users/3').set('Authorization', auth).expect(200);
    await http.get('/api/v1/users/99').set('Authorization', auth).expect(404);
    await http.get('/api/v1/users/0').set('Authorization', auth).expect(400);
    await http.get('/api/v1/users/abc').set('Authorization', auth).expect(400);
  });
});
