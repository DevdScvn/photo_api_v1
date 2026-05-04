# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Use `bunx <package> <command>` instead of `npx <package> <command>`
- Bun automatically loads `.env`, so don't use dotenv.

## Commands

```bash
bun run src/index.ts        # Run the server
bun --hot src/index.ts      # Run with hot reload
bun run build               # TypeScript compile to dist/

bunx prisma generate        # Regenerate Prisma client after schema changes
bunx prisma migrate dev     # Create and apply a new migration
bunx prisma studio          # Visual DB editor

docker compose up -d        # Start PostgreSQL + MongoDB + MinIO
```

## Project purpose

Photographer portfolio API: photographers publish posts with photos, users browse a feed and leave comments. See `plan.md` for the full roadmap.

## Architecture

This is a **polyglot persistence** project — three storage backends serving different access patterns:

| Storage    | Used for                          | Why                                                            |
|------------|-----------------------------------|----------------------------------------------------------------|
| PostgreSQL | Users, Comments, Likes            | ACID, FK constraints, no duplicate likes via composite PK      |
| MongoDB    | Posts                             | Flexible document: multiple images, EXIF metadata, tags, likesCount counter |
| MinIO      | Binary photo files (S3-compatible)| Self-hosted Docker, accessed via `@aws-sdk/client-s3`          |

The app follows `Controller → Service → Storage` layers:

| Layer       | Path                        | Responsibility                                                         |
|-------------|-----------------------------|------------------------------------------------------------------------|
| Entry point | `src/index.ts`              | Hono app, route mounting, global error handler, Swagger UI at `/docs`  |
| Controllers | `src/controllers/`          | Parse request, call service, return JSON                               |
| Services    | `src/services/`             | Business logic; each service targets one storage                       |
| Models      | `src/models/`               | Request/response types and mapper functions (no classes)               |
| Validations | `src/validations/`          | Zod schemas — must use `ZodType<T>` with explicit generic              |
| Middleware  | `src/middleware/`           | `authMiddleware`: reads `Authorization`, strips `Bearer `, calls `UserService.get()` |
| Application | `src/application/`          | Singletons: `database.ts` (PrismaClient), `mongoDatabase.ts` (Mongoose + PostModel), `minioClient.ts` (S3Client), `logging.ts` (Winston) |
| OpenAPI     | `src/openapi.ts`            | Static spec object served at `/docs/spec`; update when adding routes   |

### Cross-storage coupling

`PostService` touches both **MongoDB** (read/write posts) and **MinIO** (delete image objects on post delete).

`LikeService` touches both **PostgreSQL** (toggle like record, composite PK prevents duplicates) and **MongoDB** (`$inc likesCount` on the Post document).

`CommentService` uses only **PostgreSQL**, but calls `PostService.findById()` before creating a comment to verify the MongoDB post exists — there is no FK across databases.

## Prisma (v7)

- `datasource.url` is **not** allowed in `schema.prisma` — the connection URL lives in `prisma.config.ts`
- The generated client requires a database adapter — `@prisma/adapter-pg` is used
- Always import types from `@prisma/client`, not from a custom output path
- After any schema change run `bunx prisma generate` before starting the server

`PrismaClient` is instantiated once in `src/application/database.ts` — import `prismaClient` from there, never instantiate it elsewhere.

The `Comment` and `Like` models reference MongoDB posts via `postMongoId VARCHAR(24)` — there is no foreign key, referential integrity is enforced at the service layer.

## MongoDB (Mongoose)

`PostModel` is defined and exported from `src/application/mongoDatabase.ts`. The Post document embeds: `images[]` (url + key for MinIO deletion), `exif` object, `tags[]`, and a denormalized `likesCount`.

Never import `mongoose` directly in service files — import `PostModel` from `src/application/mongoDatabase.ts`.

## MinIO (S3)

`s3` client is exported from `src/application/minioClient.ts`. It uses `forcePathStyle: true`, which is required for MinIO. The region is `us-east-1` (MinIO ignores it but the SDK requires a value).

Upload flow: `POST /api/upload` → store file in MinIO → return `{ url, key }` → client includes these when calling `POST /api/posts`. On post delete, `PostService` calls `DeleteObjectCommand` for every `key` in `post.images`.

## Auth flow

1. `POST /api/users/login` returns a UUID token stored in the `users.token` column
2. Client sends `Authorization: Bearer <token>` (bare token also accepted)
3. `authMiddleware` strips the prefix and calls `UserService.get(token)`
4. Routes registered **after** `controller.use(authMiddleware)` are protected; the user object is available via `c.get('user')`

## Zod schemas

Always annotate with `ZodType<T>` explicitly — in Zod v4, `ZodType` without a generic returns `unknown` from `parse()`, which breaks TypeScript assignment back to the typed parameter.

```ts
static readonly REGISTER: ZodType<RegisterUserRequest> = z.object({ ... })
```

## Error handling

Global `app.onError` in `src/index.ts` catches `HTTPException` (returns its status + message) and `ZodError` (returns 400). Throw `HTTPException` from services for domain errors; let Zod validation errors propagate naturally.

## Adding a new resource

1. Create `src/models/<name>.ts` — types + mapper functions
2. Create `src/validations/<name>Validation.ts` — Zod schemas as static class fields
3. Create `src/services/<name>Service.ts` — business logic
4. Create `src/controllers/<name>Controller.ts` — Hono router, mount via `app.route('/', <name>Controller)` in `src/index.ts`
5. Add paths to `src/openapi.ts`
