// Наскрізні тести практичної роботи № 7: конвеєр обробки запиту. Файл не змінюйте.
import { Controller, Get, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Public } from '../src/auth/public.decorator.js';
import { authHeader, createApp } from './helpers.js';

/** Тестовий контролер: імітує непередбачену помилку в коді. */
@Controller('test-boom')
class BoomController {
  @Public()
  @Get()
  boom(): never {
    throw new Error('Секретна внутрішня деталь: пароль до БД');
  }
}

describe('helpdesk-api (e2e): конвеєр обробки запиту', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;

  beforeEach(async () => {
    app = await createApp({ controllers: [BoomController] });
    http = request(app.getHttpServer());
  });

  afterEach(async () => {
    await app.close();
  });

  describe('AuthGuard і RolesGuard', () => {
    it('без токена → 401, WWW-Authenticate: Bearer', async () => {
      const res = await http.get('/api/v1/tickets').expect(401);
      expect(res.headers['www-authenticate']).toContain('Bearer');
    });

    it('недійсний токен → 401', async () => {
      await http
        .get('/api/v1/tickets')
        .set('Authorization', 'Bearer not-a-token')
        .expect(401);
    });

    it('@Public: health і login доступні без токена', async () => {
      await http.get('/api/v1/health').expect(200);
    });

    it('@Roles("admin"): DELETE заявки – 403 для викладача, 204 для адміністратора', async () => {
      const teacherAuth = await authHeader(app, 'teacher');
      await http
        .delete('/api/v1/tickets/4')
        .set('Authorization', teacherAuth)
        .expect(403);
      const adminAuth = await authHeader(app, 'admin');
      await http
        .delete('/api/v1/tickets/4')
        .set('Authorization', adminAuth)
        .expect(204);
    });
  });

  describe('ProblemDetailsFilter (RFC 9457)', () => {
    it('404 у форматі application/problem+json', async () => {
      const studentAuth = await authHeader(app, 'student');
      const res = await http
        .get('/api/v1/tickets/999')
        .set('Authorization', studentAuth)
        .expect(404);
      expect(res.headers['content-type']).toContain('application/problem+json');
      expect(res.body).toMatchObject({
        type: 'about:blank',
        status: 404,
        instance: '/api/v1/tickets/999',
      });
      expect(typeof res.body.title).toBe('string');
      expect(res.body.detail).toContain('999');
    });

    it('422 зберігає масив errors', async () => {
      const studentAuth = await authHeader(app, 'student');
      const res = await http
        .post('/api/v1/tickets')
        .set('Authorization', studentAuth)
        .send({ title: '' })
        .expect(422);
      expect(res.headers['content-type']).toContain('application/problem+json');
      expect(res.body.status).toBe(422);
      expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it('409 зберігає поле allowed', async () => {
      const adminAuth = await authHeader(app, 'admin');
      const res = await http
        .post('/api/v1/tickets/5/status')
        .set('Authorization', adminAuth)
        .send({ status: 'open' })
        .expect(409);
      expect(res.body).toMatchObject({ status: 409, allowed: [] });
    });

    it('401 теж у форматі problem+json', async () => {
      const res = await http.get('/api/v1/users/me').expect(401);
      expect(res.body).toMatchObject({ status: 401, type: 'about:blank' });
    });

    it('непередбачена помилка → 500 без внутрішніх подробиць', async () => {
      const res = await http.get('/api/v1/test-boom').expect(500);
      expect(res.headers['content-type']).toContain('application/problem+json');
      expect(res.body.status).toBe(500);
      expect(JSON.stringify(res.body)).not.toContain('пароль до БД');
      expect(JSON.stringify(res.body)).not.toContain('at ');
    });

    it('невідомий маршрут → 404 у форматі problem+json', async () => {
      const res = await http.get('/api/v1/nope').expect(404);
      expect(res.headers['content-type']).toContain('application/problem+json');
    });
  });

  describe('RequestIdMiddleware і LoggingInterceptor', () => {
    it('кожна відповідь має X-Request-Id', async () => {
      const res = await http.get('/api/v1/health').expect(200);
      expect(res.headers['x-request-id']).toMatch(/^[\w-]{8,64}$/);
    });

    it('коректний вхідний X-Request-Id повертається без змін і потрапляє в тіло помилки', async () => {
      const res = await http
        .get('/api/v1/tickets/999')
        .set('X-Request-Id', 'test-req-12345')
        .expect(401);
      expect(res.headers['x-request-id']).toBe('test-req-12345');
      expect(res.body.requestId).toBe('test-req-12345');
    });

    it('некоректний вхідний X-Request-Id замінюється новим', async () => {
      const res = await http
        .get('/api/v1/health')
        .set('X-Request-Id', 'bad id!')
        .expect(200);
      expect(res.headers['x-request-id']).not.toBe('bad id!');
    });

    it('успішна відповідь має заголовок Server-Timing', async () => {
      const res = await http.get('/api/v1/health').expect(200);
      expect(res.headers['server-timing']).toMatch(/^app;dur=\d+(\.\d)?$/);
    });
  });

  describe('ParsePositiveIntPipe', () => {
    it('0, -1, 1.5, abc → 400 з назвою параметра', async () => {
      const auth = await authHeader(app, 'student');
      for (const id of ['0', '-1', '1.5', 'abc']) {
        const res = await http
          .get(`/api/v1/tickets/${id}`)
          .set('Authorization', auth)
          .expect(400);
        expect(res.body.detail).toContain('ticketId');
      }
    });
  });
});
