// Наскрізні тести заявок (практична № 6, оновлено в практичній № 7: запити з токеном, автор – з токена). Файл не змінюйте.
import { type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { authHeader, createApp, fields } from './helpers.js';

describe('helpdesk-api (e2e): заявки', () => {
  let app: INestApplication;
  let admin: string;
  let student: string;
  let teacher: string;
  const as = (auth: string) => ({
    get: (url: string) =>
      request(app.getHttpServer()).get(url).set('Authorization', auth),
    post: (url: string) =>
      request(app.getHttpServer()).post(url).set('Authorization', auth),
    patch: (url: string) =>
      request(app.getHttpServer()).patch(url).set('Authorization', auth),
    delete: (url: string) =>
      request(app.getHttpServer()).delete(url).set('Authorization', auth),
  });
  let http: ReturnType<typeof as>;

  beforeEach(async () => {
    app = await createApp();
    [admin, student, teacher] = await Promise.all([
      authHeader(app, 'admin'),
      authHeader(app, 'student'),
      authHeader(app, 'teacher'),
    ]);
    http = as(admin);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /tickets – сторінки, фільтри, сортування', () => {
    it('повертає сторінку { items, page, pageSize, total } зі значеннями за замовчуванням', async () => {
      const res = await http.get('/api/v1/tickets').expect(200);
      expect(res.body).toMatchObject({ page: 1, pageSize: 10, total: 6 });
      expect(res.body.items).toHaveLength(6);
    });

    it('за замовчуванням – від нових до старих (sort=-createdAt)', async () => {
      const res = await http.get('/api/v1/tickets').expect(200);
      expect(res.body.items.map((t: { id: number }) => t.id)).toEqual([
        6, 4, 2, 1, 5, 3,
      ]);
    });

    it('page і pageSize перетворюються з рядків на числа', async () => {
      const res = await http
        .get('/api/v1/tickets?page=2&pageSize=4')
        .expect(200);
      expect(res.body).toMatchObject({ page: 2, pageSize: 4, total: 6 });
      expect(res.body.items).toHaveLength(2);
    });

    it('фільтри status, priority і пошук q', async () => {
      const open = await http
        .get('/api/v1/tickets?status=open&priority=medium')
        .expect(200);
      expect(open.body.items.map((t: { id: number }) => t.id)).toEqual([6]);
      const q = await http.get('/api/v1/tickets?q=HDMI').expect(200);
      expect(q.body.items.map((t: { id: number }) => t.id)).toEqual([1]);
    });

    it('sort=-priority: critical першою', async () => {
      const res = await http.get('/api/v1/tickets?sort=-priority').expect(200);
      expect(res.body.items[0].priority).toBe('critical');
    });

    it('некоректні параметри → 422 з переліком полів', async () => {
      const res = await http
        .get('/api/v1/tickets?page=0&pageSize=100&status=done&sort=title')
        .expect(422);
      expect(fields(res)).toEqual(
        expect.arrayContaining(['page', 'pageSize', 'status', 'sort']),
      );
    });
  });

  describe('POST /tickets – створення і валідація', () => {
    it('201, заголовок Location, автор – власник токена, пробіли в назві обрізано', async () => {
      const res = await as(student)
        .post('/api/v1/tickets')
        .send({
          title: '  Не працює миша  ',
          priority: 'low',
          tags: ['обладнання'],
        })
        .expect(201);
      expect(res.headers.location).toBe(`/api/v1/tickets/${res.body.id}`);
      expect(res.body).toMatchObject({
        id: 7,
        title: 'Не працює миша',
        status: 'open',
        authorId: 1,
        tags: ['обладнання'],
      });
    });

    it('критичний пріоритет: здобувач → 403, викладач → 201', async () => {
      await as(student)
        .post('/api/v1/tickets')
        .send({ title: 'Сервер недоступний', priority: 'critical' })
        .expect(403);
      await as(teacher)
        .post('/api/v1/tickets')
        .send({ title: 'Сервер недоступний', priority: 'critical' })
        .expect(201);
    });

    it('порожня назва і невідомий пріоритет → 422', async () => {
      const res = await http
        .post('/api/v1/tickets')
        .send({ title: '   ', priority: 'urgent' })
        .expect(422);
      expect(fields(res)).toEqual(
        expect.arrayContaining(['title', 'priority']),
      );
    });

    it('назва довша за 80 символів → 422', async () => {
      const res = await http
        .post('/api/v1/tickets')
        .send({ title: 'x'.repeat(81), priority: 'low' })
        .expect(422);
      expect(fields(res)).toEqual(['title']);
    });

    it('зайві поля (id, status, authorId) заборонено → 422', async () => {
      const res = await http
        .post('/api/v1/tickets')
        .send({
          id: 99,
          status: 'closed',
          authorId: 2,
          title: 'Миша',
          priority: 'low',
        })
        .expect(422);
      expect(fields(res)).toEqual(
        expect.arrayContaining(['id', 'status', 'authorId']),
      );
    });
  });

  describe('PATCH /tickets/{ticketId}', () => {
    it('змінює лише передані поля й updatedAt', async () => {
      const before = (await http.get('/api/v1/tickets/4').expect(200)).body;
      const res = await http
        .patch('/api/v1/tickets/4')
        .send({ priority: 'high', assigneeId: 3 })
        .expect(200);
      expect(res.body).toMatchObject({
        id: 4,
        priority: 'high',
        assigneeId: 3,
        title: before.title,
        status: 'open',
      });
      expect(res.body.updatedAt).not.toBe(before.updatedAt);
    });

    it('assigneeId: null знімає виконавця', async () => {
      const res = await http
        .patch('/api/v1/tickets/1')
        .send({ assigneeId: null })
        .expect(200);
      expect(res.body.assigneeId).toBeNull();
    });

    it('стан і автора через PATCH змінити не можна → 422', async () => {
      const res = await http
        .patch('/api/v1/tickets/1')
        .send({ status: 'closed', authorId: 2 })
        .expect(422);
      expect(fields(res)).toEqual(
        expect.arrayContaining(['status', 'authorId']),
      );
    });

    it('чужу заявку здобувач змінити не може → 403; власну – може', async () => {
      await as(student)
        .patch('/api/v1/tickets/1')
        .send({ title: 'Інша назва' })
        .expect(403);
      await as(student)
        .patch('/api/v1/tickets/4')
        .send({ title: 'Принтер у читальному залі' })
        .expect(200);
      await as(student)
        .patch('/api/v1/tickets/4')
        .send({ assigneeId: 3 })
        .expect(403);
    });

    it('порожнє тіло → 422; неіснуюча заявка → 404', async () => {
      await http.patch('/api/v1/tickets/1').send({}).expect(422);
      await http
        .patch('/api/v1/tickets/999')
        .send({ priority: 'low' })
        .expect(404);
    });
  });

  describe('POST /tickets/{ticketId}/status', () => {
    it('open → in_progress → resolved: 200', async () => {
      await http
        .post('/api/v1/tickets/1/status')
        .send({ status: 'in_progress' })
        .expect(200);
      const res = await http
        .post('/api/v1/tickets/1/status')
        .send({ status: 'resolved' })
        .expect(200);
      expect(res.body.status).toBe('resolved');
    });

    it('недопустимий перехід → 409 з переліком допустимих станів', async () => {
      const res = await http
        .post('/api/v1/tickets/1/status')
        .send({ status: 'resolved' })
        .expect(409);
      expect(res.body.allowed).toEqual(['in_progress', 'closed']);
    });

    it('змінювати стан може викладач або адміністратор (здобувач → 403)', async () => {
      await as(student)
        .post('/api/v1/tickets/1/status')
        .send({ status: 'in_progress' })
        .expect(403);
      await as(teacher)
        .post('/api/v1/tickets/1/status')
        .send({ status: 'in_progress' })
        .expect(200);
    });

    it('невідомий стан → 422', async () => {
      await http
        .post('/api/v1/tickets/1/status')
        .send({ status: 'done' })
        .expect(422);
    });
  });

  describe('коментарі – вкладена колекція', () => {
    it('POST → 201 + Location; GET колекції і окремого коментаря', async () => {
      const created = await http
        .post('/api/v1/tickets/1/comments')
        .send({ text: ' Замінили кабель ' })
        .expect(201);
      expect(created.headers.location).toBe(
        `/api/v1/tickets/1/comments/${created.body.id}`,
      );
      expect(created.body).toMatchObject({
        ticketId: 1,
        authorId: 3,
        text: 'Замінили кабель',
      });
      const list = await http.get('/api/v1/tickets/1/comments').expect(200);
      expect(list.body).toMatchObject({ total: 1, page: 1 });
      await http.get(created.headers.location).expect(200);
    });

    it('коментар до неіснуючої заявки → 404; порожній текст → 422', async () => {
      await http
        .post('/api/v1/tickets/999/comments')
        .send({ text: 'x' })
        .expect(404);
      await http
        .post('/api/v1/tickets/1/comments')
        .send({ text: '' })
        .expect(422);
    });
  });
});
