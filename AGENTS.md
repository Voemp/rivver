# AGENTS.md

Guidance for AI agents working in the **Rivver** repository. Read this before making changes. It captures the project's actual architecture, conventions, and non-obvious facts so you don't have to re-derive them.

## What Rivver is

A full-stack **RSS aggregator with a personalized recommendation system**. It keeps RSS's open, user-controlled content sourcing while adding the recommendation, search, and behavior modeling found in modern content platforms. Core idea: content comes from user RSS subscriptions; the homepage is a personalized recommendation feed (not a plain timeline) that supports `article`, `image`, and `video` content types; recommendations derive from real read behavior.

It is a Turborepo + Bun monorepo with two apps:

- `apps/server` — Bun + Elysia API server (PostgreSQL via Drizzle, Better Auth, RSS fetching, embeddings, recommendation pipeline)
- `apps/web` — React 19 + Vite SPA client (TanStack Router/Query, Tailwind CSS v4, Base UI)

The UI is in Chinese; server error messages and commit messages are also in Chinese.

## Repo layout

```text
apps/
  server/                      # Bun + Elysia API
    src/
      index.ts                 # Elysia app bootstrap: plugins, cron, error handling, mounts modules
      db/                      # schema.ts (all tables), relations, model.ts (TypeBox models), utils
      modules/                 # Elysia route modules: article, auth, feed, profile, subscription
      repos/                   # DB access layer, one file per table/domain (articleRepo, feedRepo, ...)
      worker/                  # standalone background jobs: rss (fetch), embedding (generate)
      types/, utils/           # response helpers, error, cors
    drizzle.config.ts          # drizzle-kit config (casing: snake_case)
  web/
    src/
      api/                     # Eden treaty client (client.ts) + TanStack Query options (queries.ts)
      components/              # feature components + apps/web/src/components/ui/** (local Base UI kit)
      config/env.ts            # VITE_* env handling
      hooks/                   # use-auth, use-infinite-scroll, use-reading-progress, ...
      routes/                  # file-based TanStack Router routes (routeTree.gen.ts is generated)
      types/                   # shared domain types (ContentType, icon)
      lib/, utils/
oxlint.config.ts               # lint rules
oxfmt.config.ts                # formatter config (no semicolons, single quotes)
turbo.json
bun.lock                       # Bun lockfile
```

## Toolchain & commands

Package manager is **Bun** (`bun@1.4.2`), workspace scripts live in the root `package.json` as Turborepo tasks. Linting and formatting use the **Oxc toolchain** (`oxlint`, `oxfmt`), not ESLint/Prettier.

From the repo root:

```bash
bun install          # install all workspace deps
bun run dev          # turbo dev — starts both server and web
bun run build        # turbo build
bun run lint         # oxlint (type-aware)
bun run lint:fix     # oxlint --fix
bun run fmt          # oxfmt (formats)
bun run fmt:check    # oxfmt --check
```

Per-app:

```bash
# server
cd apps/server && bun run dev            # bun run --watch src/index.ts  (port 3000)
# workers
bun run worker:rss                       # fetch RSS content
bun run worker:embedding                 # generate article embeddings
# db
bun run db:push / db:pull / db:studio    # drizzle-kit
# web
cd apps/web && bun run dev               # vite
```

Type checking is covered by `oxlint` with `typeAware`/`typeCheck`, which already catches most type issues across the workspace.

OpenAPI/Swagger UI is served at `/openapi` when the server runs.

## Code style (oxfmt + oxlint enforced)

- **No semicolons** and **single quotes** (see `oxfmt.config.ts`).
- Imports: use `import type` for type-only imports (`@typescript-eslint/consistent-type-imports` is `error`).
- React components use `function` declarations (not arrow consts) in this codebase.
- Path aliases: server uses `@server/*` → `apps/server/src/*`; web uses `@/*` → `apps/web/src/*`. Inline `../` imports are used sparingly within modules/repos.
- `no-explicit-any` is at `warn`, but is used in `db/utils.ts` type plumbing deliberately.
- `apps/web/src/components/ui/**` is ignored by both oxlint and oxfmt (vendored Base UI kit / shadcn-style output — don't aggressively reformat it).
- Install anything new with `bun add`, and prefer keeping both apps' dependency lists tidy.

## Server architecture (`apps/server`)

- **Elysia** app assembled in `src/index.ts`. It `use()`s modules per domain: `profile`, `subscription`, `article`, `feed`, plus `auth` (Better Auth, mounted via `.mount(auth.handler)`).
- A 24h cron (`@elysiajs/cron`, `Patterns.everyHours(24)`) runs RSS fetch + embedding generation in the background. Standalone worker entrypoints (`worker/rss`, `worker/embedding`) exist for `bun run worker:*`.
- **Layering pattern:** `modules/*` = routes/controllers that call `repos/*` for data. `repos/*` are the only place that touches `db` directly — keep repo access there.
- Each module exports an `Elysia` instance; routes use Elysia inline handlers with `query`/`params`/`body`/`response` schema declarations (TypeBox via `@sinclair/typebox` / `elysia`'s `t`), plus `detail` for OpenAPI tags/security.
- Some routes also declare `auth: true` in options (see the `macro` in `modules/auth/service.ts`), which injects `user`/`session` and returns 401 for unauthenticated requests. Not every authenticated route relies on it — check the handler signature.

### Error handling — the `res` / `AppError` pattern

- `AppError(status, message, code)` — `apps/server/src/utils/error.ts`. Throw it in routes for domain errors, e.g. `throw new AppError(404, '文章不存在', 'ARTICLE_NOT_FOUND')`.
- `res.success(data)` returns `{ success: true, data, error: null }`; `res.error(message, code)` returns `{ code, message }` (`types/response.ts`).
- Elysia's `.onError` handler in `index.ts` converts `AppError` → its response and `VALIDATION` → 422. Most happy-path handlers return `status(200, payload)` rather than wrapping — match the pattern of the module you're editing.

### DB layer (Drizzle) — read this before touching schema

- Schema lives in `apps/server/src/db/schema.ts`; relations in `db/relations.ts`; the connected drizzle instance in `db/index.ts` (using `postgres-js`).
- Drizzle is pinned to **`drizzle-orm`/`drizzle-kit` `rc.4`**. In this version, **runtime `drizzle({ casing })` is ignored** — casing must be set at schema-definition time. This is why `schema.ts` uses `const pgTable = pgTableCreator((name) => name, 'snake_case')` and `drizzle.config.ts` sets `casing: 'snake_case'`. **Always use `pgTable` (the creator), never the raw `pgTable` from `drizzle-orm/pg-core`, so new tables stay snake_case.** Do not "fix" this by passing casing to `drizzle()`.
- All tables are created with `.withRLS(...)` and reference each other by snake-cased FK names.
- `pgvector` is used: `article.embedding` is `vector({ dimensions: 384 })` with an HNSW `vector_cosine_ops` index; `userInterest.interestVector` is the per-user profile vector. Search/NLP relies on `article.contentSnippet` (plain-text content).
- `db/model.ts` + `db/utils.ts` generate TypeBox insert/select schemas from the table (`createModel`), letting Elysia validate against the actual schema. Refinements per table are passed to `createModel` (e.g. uri formats, `Date`, nullable fields).
- Better Auth tables (`user`, `session`, `account`, `verification`) are defined here and are managed by Better Auth — don't re-shape them casually.
- Schema changes are applied to the DB via `db:push` (no migration files in repo; `drizzle/` is gitignored).

### Recommendation pipeline

Follows `README.md`; key facts an agent should know:

- Inputs: RSS content → 384-dim embeddings via `@huggingface/transformers` (`TaylorAI/gte-tiny`), generated from title + first ~200 chars of summary. Content type is classified as `article`/`image`/`video`.
- Behavior signals recorded in `user_behavior`: `click`(1), `read`(scaled by progress, 1–4), `favorite`(6), `share`(8), with time decay. Favorites also make a row in `user_favorite`.
- `refreshRecommendations(userId)` = `refreshUserInterest` + `seedUserRecommendations`, written into `user_recommendation`. The `/article/recommendation` route re-seeds on `offset === 0` and falls back to popular when personalized data is thin. Many behavior routes fire `void refreshRecommendations(user.id)` (fire-and-forget) after recording.

## Web architecture (`apps/web`)

- **React 19** + **Vite 8** (Rolldown-powered). TypeScript project refs (`tsconfig.app.json` / `tsconfig.node.json`).
- **TanStack Router** file-based routing: routes in `src/routes/*.tsx`. `src/routeTree.gen.ts` is **generated** by the router plugin — don't edit it by hand. Run the dev server to regenerate, or `tanstack-router` command.
- **TanStack Query**: query/infinite-query option factories live in `src/api/queries.ts` (e.g. `articlesInfiniteOptions`, `articleDetailQueryOptions`). The homepage uses infinite queries + `use-infinite-scroll` for recommendation vs popular based on auth state.
- **API client** is **Eden treaty** (`@elysiajs/eden`), typed end-to-end against the server's `App` type: `appClient = treaty<App>(env.apiBaseUrl, { fetch: { credentials: 'include' } })`. Response unwrapping goes through `unwrapResponse(...)` which throws `ApiError`. Cookies carry the session (`credentials: 'include'`). Auth-specific calls go through `better-auth/react` `authClient`.
- **UI kit:** components under `components/ui/**` are a local Base UI / shadcn-style kit (recently migrated **from Radix UX to Base UI**). Uses `class-variance-authority`, `tailwind-merge`, `cn`, `sonner` for toasts. When adding a UI primitive, extend this kit rather than importing Radix directly. Feature components live under `components/<feature>/`.
- **Styling:** Tailwind **v4** via `@tailwindcss/vite` (CSS-first config in `src/style.css`); `tw-animate-css`; dark mode via `next-themes`.
- **Env/config:** all `VITE_*` vars are read once in `src/config/env.ts` (`VITE_API_BASE_URL` default `http://localhost:3000`, `VITE_APP_NAME`, `VITE_RECOMMENDATION_PAGE_SIZE` default `12`), not scattered through the app.
- Server env vars live in `apps/server/.env` (gitignored): `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, optional `TRUSTED_ORIGINS`/`PORT`/`NODE_ENV`, and optional AI-summary vars (`AI_SUMMARY_API_KEY`, `AI_SUMMARY_MODEL`, `AI_SUMMARY_BASE_URL`). There is no committed `.env.example`.

## Development workflow notes

- Working tree is usually on `master` and commits are small, scoped, conventional (`feat(scope): …`, `refactor(scope): …`, `fix(scope): …`), with Chinese descriptions.
- The codebase is React 19 + React Compiler (via `babel-plugin-react-compiler` — the Vite babel preset is `reactCompilerPreset()`). Keep components compatible with the compiler (avoid patterns it disallows).
- When changing DB fields, keep `schema.ts`, `relations.ts`, `db/model.ts` refinements, and any `contentType` unions (`content_kind`) consistent. The `ContentType` union is mirrored in web's `src/types/content.ts` and `types/response.ts`-style models.
- Prefer small, surgical diffs. Run `bun run lint` and `bun run fmt:check` before finishing.
