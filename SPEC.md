# Вимоги практичної роботи № 7 «Конвеєр обробки запиту»

Продовження проєкту практичної роботи № 6. Перевірка: `npm run check` – 5 модульних і 43 e2e-тести
(`test/app.e2e-spec.ts`, `test/tickets.e2e-spec.ts`, `test/pipeline.e2e-spec.ts`; спільні функції – `test/helpers.ts`).
Файли тестів не змінюйте.

## Порядок обробки запиту

```
middleware → guards → interceptors (до) → pipes → обробник → interceptors (після) → exception filters
```

| Елемент | Клас / файл | Реєстрація | Що робить |
|---|---|---|---|
| Middleware | `RequestIdMiddleware` – `src/common/http/request-id.middleware.ts` | `AppModule.configure()` для `*path` | бере коректний вхідний `X-Request-Id` (`^[\w-]{8,64}$`) або генерує UUID; записує в `req.requestId` і заголовок відповіді |
| Guard | `AuthGuard` – `src/auth/auth.guard.ts` | `APP_GUARD` в AuthModule | вимагає `Authorization: Bearer <токен>`, крім маршрутів з `@Public()`; записує `req.user`; інакше 401 |
| Guard | `RolesGuard` – `src/auth/roles.guard.ts` | `APP_GUARD` (після AuthGuard) | перевіряє ролі з `@Roles(...)`; інакше 403 |
| Interceptor | `LoggingInterceptor` – `src/common/http/logging.interceptor.ts` | `APP_INTERCEPTOR` | для успішних відповідей: заголовок `Server-Timing: app;dur=<мс>` і рядок журналу `метод URL → код мс [Клас.метод] [requestId]` |
| Pipe | `ParsePositiveIntPipe` – `src/common/http/parse-positive-int.pipe.ts` | у `@Param(...)` усіх ідентифікаторів | ціле ≥ 1, інакше 400 з назвою параметра в тексті |
| Filter | `ProblemDetailsFilter` – `src/common/http/problem-details.filter.ts` | `APP_FILTER` | будь-яка помилка → `application/problem+json`: type, title, status, detail, instance, requestId + додаткові поля (errors, allowed); непередбачена помилка → 500 без подробиць; для 401 – заголовок `WWW-Authenticate: Bearer realm="helpdesk"` |

## Автентифікація (спрощена, до розділу 7)

- `POST /auth/login { email, password }` (`@Public()`) → 200 `{ accessToken, tokenType: "Bearer", expiresIn: 3600 }`; 401 – невірні дані; 422 – некоректний email.
- Навчальні облікові записи: a.petrenko@… / student123 (student), m.koval@… / teacher123 (teacher), o.shevchuk@… / admin123 (admin).
- Токени – випадкові UUID у пам’яті (у розділі 7 їх замінять JWT, а паролі – хеші).
- `@CurrentUser()` – декоратор параметра, що повертає `req.user`.

## Зміни маршрутів

| Маршрут | Зміна |
|---|---|
| GET /health | `@Public()` |
| GET /users | `@Roles('admin')` |
| GET /users/me | новий: поточний користувач (оголосити **до** `:userId`) |
| POST /tickets, POST /tickets/{id}/comments | поле authorId прибрано з DTO; автор – поточний користувач |
| POST /tickets з priority=critical | здобувач → 403 |
| PATCH /tickets/{id} | лише автор або адміністратор (403); assigneeId – лише адміністратор |
| POST /tickets/{id}/status | `@Roles('teacher', 'admin')` |
| DELETE /tickets/{id} | `@Roles('admin')` |
