# Rivver

## 简介
Rivver 是一个 RSS 内容聚合与个性化推荐应用的全栈仓库，包含 Web 前端与 Bun + Elysia 服务端。服务端负责 RSS 抓取、文章入库、行为记录、推荐计算与头像管理；前端提供订阅管理、阅读与收藏体验。

## 目录结构
- `apps/server`：Bun + Elysia API 服务
- `apps/web`：Vite + React Web 客户端

## 技术栈
服务端:
- Bun、Elysia
- PostgreSQL、Drizzle ORM
- Better Auth（Cookie 会话、邮箱密码、Google OAuth）
- rss-parser、@xenova/transformers（gte-tiny）、sharp
- OpenAPI

前端:
- React 19、Vite 8
- TanStack Router、TanStack Query
- Tailwind CSS v4、Radix UI、shadcn/ui
- better-auth client、react-hook-form、zod

工程化:
- Turborepo
- TypeScript

## 运行方式
1. 安装依赖：`bun install`
2. 配置环境变量（见下文）
3. 开发模式：在仓库根目录运行 `bun run dev`（同时启动 `apps/server` 与 `apps/web`）
4. 单独启动：分别在 `apps/server` 或 `apps/web` 目录运行 `bun run dev`
5. 构建：`bun run build`
6. 类型检查：`bun run check-types`

## 环境变量
服务端（`apps/server`）:
- `DATABASE_URL`：PostgreSQL 连接串
- `BETTER_AUTH_SECRET`：Better Auth 密钥
- `BETTER_AUTH_URL`：认证服务基础地址
- `GOOGLE_CLIENT_ID`：Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET`：Google OAuth Client Secret
- `TRUSTED_ORIGINS`：允许跨域来源，逗号分隔（可选）
- `PORT`：服务端口，默认 `3000`（可选）
- `NODE_ENV`：生产环境建议设为 `production`（可选）

前端（`apps/web`）:
- `VITE_API_BASE_URL`：API 基础地址，默认 `http://localhost:3000`
- `VITE_APP_NAME`：应用名称，默认 `Rivver RSS`
- `VITE_RECOMMENDATION_PAGE_SIZE`：推荐分页大小，默认 `12`

## API 概览
认证与会话:
- `GET/POST /auth/*`：Better Auth 内置路由（登录、回调、获取会话、登出等）
- 前端调用受保护接口需携带 Cookie：`fetch(..., { credentials: 'include' })`

公开接口:
- `GET /article/:id`
- `GET /article/popular`
- `GET /feed/:id`
- `GET /feed/:id/articles`

需登录接口（Cookie 会话）:
- `GET /article/recommendation`
- `GET /article/favorites`
- `POST/DELETE/GET /article/:id/favorite`
- `POST /article/:id/click`
- `POST /article/:id/read-progress`
- `POST /article/:id/share`
- `GET/POST/DELETE /subscription`
- `GET /feed/:id/subscription`
- `GET /profile`
- `PUT /profile/avatar`
- `GET /profile/avatar`

## 文档
- OpenAPI：`/openapi`

## 后台任务
API 内置定时任务每 24 小时触发一次 RSS 抓取与向量生成。

以下命令在 `apps/server` 目录执行:
- `bun run worker:rss`
- `bun run worker:embedding`

## 数据库与迁移
Drizzle Schema 位于 `apps/server/src/db/schema.ts`。

以下命令在 `apps/server` 目录执行:
- `bun run db:push`
- `bun run db:pull`
- `bun run db:studio`
