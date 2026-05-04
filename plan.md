# План разработки: API для портфолио фотографов

## Концепция

Платформа, где фотографы публикуют работы в виде постов с фотографиями,
а пользователи просматривают ленту и оставляют комментарии.

**Стек:**
- **Бэкенд:** Hono + Bun + TypeScript
- **PostgreSQL** (Prisma 7) — пользователи, комментарии, лайки
- **MongoDB** (Mongoose) — посты, уведомления (будущее)
- **MinIO** — S3-совместимое хранилище фотографий (Docker)
- **Фронтенд:** Vue 3 + Pinia + Vue Router (отдельный проект)
- **Документация API:** Swagger UI на `/docs`

---

## Архитектура хранения данных

### Почему три хранилища?

Разные сущности имеют разные характеристики — это классический **polyglot persistence**:

| Хранилище    | Что хранит                    | Почему именно здесь                                                                 |
|--------------|-------------------------------|-------------------------------------------------------------------------------------|
| PostgreSQL   | Users, Comments, Likes        | Строгая реляционная целостность, ACID, каскадные удаления, нет дубликатов           |
| MongoDB      | Posts                         | Гибкая схема документа: теги, EXIF, несколько URL фото, счётчики — всё в одном doc  |
| MinIO        | Бинарные файлы фотографий     | S3-совместимый объектный storage, бесплатный self-hosted Docker образ               |

### Подробное обоснование

**PostgreSQL — для комментариев и лайков:**
- Комментарий строго принадлежит посту И пользователю — FK-связи + каскадные удаления критичны
- Лайк — это `(postMongoId, username)` с уникальным ограничением, `INSERT ... ON CONFLICT DO NOTHING` — атомарная защита от дубликатов
- Пагинация комментариев — стандартный `LIMIT/OFFSET` SQL
- Авторизационный токен пользователя должен быть защищён ACID-транзакциями

**MongoDB — для постов:**
- Документ поста естественно содержит вложенные данные:
  - массив URL фотографий (один пост = несколько кадров)
  - EXIF метаданные (камера, ISO, диафрагма, геолокация) — схема у каждого поста своя
  - массив тегов для фильтрации
  - денормализованный счётчик лайков `likesCount` для быстрого чтения ленты
- Лента (`GET /api/posts`) — MongoDB Aggregation Pipeline c сортировкой, фильтрами по тегам
- Схема постов будет эволюционировать — MongoDB не требует миграций на ALTER TABLE

**Важное ограничение polyglot:**
В `comments` и `likes` в PostgreSQL поле `postMongoId VARCHAR(24)` хранит MongoDB ObjectId —
**без FK** (разные базы). Целостность обеспечивается на уровне приложения: перед созданием
комментария сервис проверяет существование поста в MongoDB.

**MinIO — для файлов:**
- S3-совместимый API → используем `@aws-sdk/client-s3` с кастомным `endpoint`
- При создании поста: загружаем файл в MinIO → получаем URL → сохраняем в MongoDB
- Один Docker контейнер, данные персистентны через volume

### Схема взаимодействия

```
Client
  │
  ▼
Hono API
  ├── UserService      → PostgreSQL (Prisma)
  ├── PostService      → MongoDB (Mongoose) + MinIO (S3 SDK)
  ├── CommentService   → PostgreSQL (Prisma)   [postMongoId — строковый ID из MongoDB]
  └── LikeService      → PostgreSQL (Prisma) + MongoDB (обновить likesCount)
```

---

## Docker Compose (dev-окружение)

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: photographer
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"   # S3 API
      - "9001:9001"   # Web Console
    volumes:
      - minio_data:/data

volumes:
  postgres_data:
  mongo_data:
  minio_data:
```

**Переменные окружения (.env):**
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/photographer
MONGODB_URL=mongodb://localhost:27017/photographer
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=photos
```

---

## Этап 1 — Схемы данных

### 1A. PostgreSQL (Prisma) — обновить `schema.prisma`

```prisma
model User {
  username String    @id @db.VarChar(100)
  password String    @db.VarChar(100)
  name     String    @db.VarChar(100)
  token    String?   @db.VarChar(100)

  comments Comment[]
  likes    Like[]

  @@map("users")
}

model Comment {
  id          Int      @id @default(autoincrement())
  text        String   @db.Text
  postMongoId String   @db.VarChar(24)   // MongoDB ObjectId, без FK
  authorId    String   @db.VarChar(100)
  createdAt   DateTime @default(now())

  author User @relation(fields: [authorId], references: [username])

  @@map("comments")
}

model Like {
  postMongoId String @db.VarChar(24)   // MongoDB ObjectId, без FK
  userId      String @db.VarChar(100)

  user User @relation(fields: [userId], references: [username])

  @@id([postMongoId, userId])
  @@map("likes")
}
```

```bash
bunx prisma migrate dev --name polyglot_schema
bunx prisma generate
```

### 1B. MongoDB (Mongoose) — схема поста

```ts
// src/application/mongoDatabase.ts
import mongoose from 'mongoose'

const postSchema = new mongoose.Schema({
  title:       { type: String, required: true, maxlength: 200 },
  description: { type: String },
  authorId:    { type: String, required: true },  // username из PostgreSQL
  images: [{
    url:      String,   // URL в MinIO
    key:      String,   // ключ объекта в MinIO (для удаления)
    mimeType: String,
  }],
  exif: {
    camera:    String,
    lens:      String,
    iso:       Number,
    aperture:  String,
    shutter:   String,
    takenAt:   Date,
    location:  { lat: Number, lng: Number },
  },
  tags:       [String],
  likesCount: { type: Number, default: 0 },
}, { timestamps: true })

postSchema.index({ createdAt: -1 })   // сортировка ленты
postSchema.index({ tags: 1 })         // фильтр по тегу
postSchema.index({ authorId: 1 })     // посты автора

export const PostModel = mongoose.model('Post', postSchema)
```

```bash
bun add mongoose
```

---

## Этап 2 — Загрузка фотографий (MinIO)

### Инициализация клиента MinIO

```ts
// src/application/minioClient.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

export const s3 = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT,
  region: 'us-east-1',   // MinIO игнорирует, но SDK требует
  credentials: {
    accessKeyId:     process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
  forcePathStyle: true,   // обязательно для MinIO
})
```

### Эндпоинт загрузки

```
POST /api/upload        multipart/form-data, поле "photo"
→ { url, key }          возвращает публичный URL и ключ объекта
```

Поток: клиент загружает фото → получает URL и key → при создании поста передаёт их в теле запроса → сервер сохраняет в MongoDB.

При удалении поста: сервис вызывает `DeleteObjectCommand` для каждого `key` из массива `images`.

```bash
bun add @aws-sdk/client-s3
```

---

## Этап 3 — Бэкенд: посты (MongoDB)

### Эндпоинты

| Метод  | Путь                  | Доступ      | Описание                                  |
|--------|-----------------------|-------------|-------------------------------------------|
| GET    | `/api/posts`          | Публичный   | Лента постов (пагинация, фильтр по тегу)  |
| GET    | `/api/posts/:id`      | Публичный   | Один пост (MongoDB ObjectId)              |
| POST   | `/api/posts`          | Авторизован | Создать пост                              |
| PATCH  | `/api/posts/:id`      | Автор поста | Редактировать (title, description, tags)  |
| DELETE | `/api/posts/:id`      | Автор поста | Удалить пост + файлы из MinIO             |

### Пагинация ленты

Запрос: `GET /api/posts?page=1&size=20&tag=portrait`

Ответ:
```json
{
  "data": [
    {
      "_id": "664a...",
      "title": "Golden Hour",
      "images": [{ "url": "http://localhost:9000/photos/abc.jpg" }],
      "tags": ["portrait", "golden-hour"],
      "likesCount": 42,
      "author": { "username": "john", "name": "John Doe" },
      "createdAt": "2026-05-04T10:00:00Z"
    }
  ],
  "paging": { "page": 1, "size": 20, "total": 150 }
}
```

### Структура файлов

```
src/
  controllers/postController.ts
  services/postService.ts         ← MongoDB + MinIO
  models/post.ts                  ← request/response типы
  validations/postValidation.ts
  application/mongoDatabase.ts    ← mongoose connect + PostModel
  application/minioClient.ts      ← S3Client
```

---

## Этап 4 — Бэкенд: комментарии (PostgreSQL)

### Эндпоинты

| Метод  | Путь                           | Доступ      | Описание                         |
|--------|--------------------------------|-------------|----------------------------------|
| GET    | `/api/posts/:id/comments`      | Публичный   | Список комментариев (пагинация)  |
| POST   | `/api/posts/:id/comments`      | Авторизован | Добавить комментарий             |
| DELETE | `/api/posts/:id/comments/:cid` | Автор ком.  | Удалить комментарий              |

**Логика целостности:** `PostService.findById(postMongoId)` вызывается перед созданием комментария — если пост не найден в MongoDB, возвращаем 404.

### Структура файлов

```
src/
  controllers/commentController.ts
  services/commentService.ts
  models/comment.ts
  validations/commentValidation.ts
```

---

## Этап 5 — Лайки (PostgreSQL + MongoDB)

### Логика toggle-лайка

```
POST /api/posts/:id/like
```

1. Попытаться вставить в PostgreSQL: `INSERT INTO likes (postMongoId, userId) VALUES (?, ?) ON CONFLICT DO NOTHING`
2. Если вставлено (rowsAffected = 1) → `PostModel.updateOne({ likesCount: +1 })`
3. Если конфликт (лайк уже есть) → удалить лайк + `PostModel.updateOne({ likesCount: -1 })`
4. Вернуть `{ liked: bool, likesCount: number }`

**Почему так:** счётчик в MongoDB для быстрого чтения ленты, уникальность лайка в PostgreSQL через составной PK.

---

## Этап 6 — Фронтенд на Vue 3

### Инициализация (отдельная директория)

```bash
bun create vue@latest photographer-frontend
cd photographer-frontend
bun add pinia vue-router axios
```

### Структура

```
src/
  views/
    FeedView.vue       # Лента с LazyLoad карточек
    PostView.vue       # Пост + комментарии
    ProfileView.vue    # Профиль фотографа + его посты
    LoginView.vue      # Логин/регистрация
    UploadView.vue     # Создание поста (drag&drop фото)
  components/
    PostCard.vue       # Карточка в ленте
    ImageGallery.vue   # Галерея фото поста
    CommentList.vue    # Пагинируемый список комментариев
    CommentForm.vue    # Форма добавления комментария
    LikeButton.vue     # Кнопка лайка с оптимистичным обновлением
    TagFilter.vue      # Фильтрация ленты по тегам
  stores/
    auth.ts            # Pinia: токен, текущий пользователь
    posts.ts           # Pinia: лента, кэш постов, тег-фильтр
  api/
    client.ts          # Axios instance с Authorization header
    posts.ts
    comments.ts
    users.ts
    upload.ts
```

### CORS на бэкенде

```ts
// src/index.ts
import { cors } from 'hono/cors'
app.use('/api/*', cors({ origin: 'http://localhost:5173' }))
```

---

## Этап 7 — Улучшения (по мере развития)

| Фича                   | Описание                                                              |
|------------------------|-----------------------------------------------------------------------|
| Профили пользователей  | Аватар (MinIO), bio, ссылки — расширить User или вынести в MongoDB    |
| Подписки               | `Follow` в PostgreSQL, лента только от подписок (filter by authorId) |
| Уведомления            | MongoDB коллекция `notifications`, SSE или polling                    |
| Поиск                  | MongoDB text index на `title + description + tags`                    |
| EXIF авто-парсинг      | `exifr` библиотека — парсить EXIF при загрузке фото                  |
| Refresh токены / JWT   | JWT с expiry вместо UUID токена в PostgreSQL                          |
| Rate limiting          | Hono middleware `hono/throttling` для защиты от спама                 |
| Resize / thumbnail     | `sharp` — генерировать превью при загрузке, хранить в MinIO           |
| Тесты                  | `bun test` + интеграционные тесты с реальными БД                      |

---

## Порядок работы (рекомендуемый)

1. **Сейчас:** поднять Docker Compose (postgres + mongo + minio)
2. Обновить Prisma схему (убрать Post, добавить Comment/Like с `postMongoId`)
3. Добавить `mongoDatabase.ts` (mongoose) и `minioClient.ts` (S3 SDK)
4. Реализовать загрузку фото (`POST /api/upload`) — Этап 2
5. Реализовать CRUD постов через MongoDB — Этап 3
6. Реализовать комментарии — Этап 4
7. Реализовать лайки — Этап 5
8. Создать Vue-проект — Этап 6

---

## Текущее состояние проекта

- [x] User модель (PostgreSQL / Prisma)
- [x] Регистрация, логин, логаут
- [x] authMiddleware
- [x] Swagger UI на `/docs`
- [ ] Docker Compose (postgres + mongo + minio)
- [ ] Mongoose подключение + Post схема
- [ ] MinIO клиент + загрузка фото
- [ ] Посты (MongoDB)
- [ ] Комментарии (PostgreSQL)
- [ ] Лайки (PostgreSQL + MongoDB counter)
- [ ] Vue фронтенд
