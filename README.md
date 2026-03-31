# 📝 To-Do List (Nuxt 3 + MSW Mock API)

Мини‑приложение «Список задач» (To‑Do List) на **Nuxt 3**.

Вместо реального бэкенда используется **MSW (Mock Service Worker)**, который перехватывает запросы к `/api/*` в браузере и возвращает ответы как будто это настоящий REST API (JWT‑авторизация, роли, ошибки, пагинация, фильтры).

---

## Требования

- Node.js **18+** (рекомендуется 20+)
- npm (или другой пакетный менеджер)

---

## Установка зависимостей

В корне папки проекта `to-do`:

```bash
npm install
```

---

## Настройка `.env`

Создайте файл `.env` в корне проекта `to-do` (рядом с `package.json`).

Пример `.env`:

```bash
# Используется только для удобства (в коде обращаемся через runtimeConfig).
# По умолчанию axios ходит на /api, а MSW в dev перехватывает эти запросы.
NUXT_PUBLIC_API_BASE_URL=/api

# При желании можно явно выключить MSW в dev.
# true/1  — включить
# false/0 — выключить
NUXT_PUBLIC_USE_MSW=true
```

Примечания:

- В текущей реализации **MSW стартует только в dev** и только на клиенте (`plugins/msw.client.ts`).
- `.env` не обязателен — проект запускается и без него (есть значения по умолчанию).

---

## Запуск в режиме разработки

```bash
npm run dev
```

Откройте адрес, который выведется в терминале (обычно `http://localhost:3000/`, но порт может быть другим, если 3000 занят).

Тестовые пользователи:

- `admin@test.com` / `123456` — роль **admin**
- `user@test.com` / `123456` — роль **user**

---

## Сборка и запуск production‑сборки локально

Сборка:

```bash
npm run build
```

Локальный предпросмотр:

```bash
npm run preview
```

---

## Архитектура (кратко)

- **JWT в localStorage**: `token` и `user`.
- **Перехват 401**: axios‑интерсептор очищает `token/user` и редиректит на `/login`.
- **Роли**: редактирование/удаление доступно только создателю (`CreatedBy`) или админу.
- **MSW мок‑API**: лежит в `mocks/` и подключается плагином `plugins/msw.client.ts`.

---

## API эндпоинты

Все запросы идут на базовый URL: `NUXT_PUBLIC_API_BASE_URL` (по умолчанию `/api`).

### Авторизация

#### `POST /api/auth/login`

Тело запроса:

```json
{
  "email": "admin@test.com",
  "password": "123456"
}
```

Успешный ответ `200 OK`:

```json
{
  "token": "1",
  "user": { "id": 1, "email": "admin@test.com", "role": "admin" }
}
```

Ошибки:

- `401 Unauthorized` — неверные логин/пароль

### Задачи

#### `GET /api/tasks`

Заголовки:

- `Authorization: Bearer <token>`

Query‑параметры (все опциональные):

- `status`: `all | active | completed | overdue`
- `search`: строка поиска по `Title` + `Description`
- `sort`: `createdDesc | createdAsc | dueAsc | dueDesc | status | titleAsc`
- `createdRange`: `all | 7d | 30d | month`
- `authorId`: `all` или число (id пользователя)
- `page`: номер страницы (1..)
- `pageSize`: размер страницы (по умолчанию 5, максимум 50)

Ответ `200 OK`:

```json
{
  "data": [
    {
      "Id": 1,
      "Title": "Купить продукты",
      "Description": "Молоко, хлеб, овощи",
      "DueDate": "2024-04-25",
      "IsCompleted": false,
      "CreatedBy": 2,
      "CreatedAt": "2024-04-01"
    }
  ],
  "meta": { "total": 12, "page": 1, "pageSize": 5 }
}
```

Ошибки:

- `401 Unauthorized` — нет/неверный токен

#### `POST /api/tasks`

Заголовки:

- `Authorization: Bearer <token>`

Тело запроса:

```json
{
  "Title": "Новая задача",
  "Description": "Описание",
  "DueDate": "2026-02-20",
  "IsCompleted": false
}
```

Ответ `201 Created`:

```json
{
  "Id": 123,
  "Title": "Новая задача",
  "Description": "Описание",
  "DueDate": "2026-02-20",
  "IsCompleted": false,
  "CreatedBy": 2,
  "CreatedAt": "2026-03-31"
}
```

Ошибки:

- `400 Bad Request` — пустой `Title` или некорректный `DueDate`
- `401 Unauthorized` — нет/неверный токен

#### `PUT /api/tasks/:id`

Заголовки:

- `Authorization: Bearer <token>`

Тело запроса (полная модель для обновления):

```json
{
  "Title": "Обновлённая задача",
  "Description": "Описание",
  "DueDate": "2026-02-21",
  "IsCompleted": true
}
```

Ответ `200 OK` — обновлённая задача.

Ошибки:

- `400 Bad Request` — некорректный `id` или валидация `Title/DueDate`
- `401 Unauthorized` — нет/неверный токен
- `403 Forbidden` — не создатель и не admin
- `404 Not Found` — задача не найдена

#### `DELETE /api/tasks/:id`

Заголовки:

- `Authorization: Bearer <token>`

Ответ `204 No Content`.

Ошибки:

- `400 Bad Request` — некорректный `id`
- `401 Unauthorized` — нет/неверный токен
- `403 Forbidden` — не создатель и не admin
- `404 Not Found` — задача не найдена

---

## Где смотреть реализацию

- Frontend:
  - `pages/login.vue`
  - `pages/index.vue`
  - `middleware/auth.ts`
  - `plugins/api.client.ts`
- Mock API (MSW):
  - `plugins/msw.client.ts`
  - `mocks/browser.ts`
  - `mocks/handlers/auth.handlers.ts`
  - `mocks/handlers/tasks.handlers.ts`
  - `mocks/data/*.ts`

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
