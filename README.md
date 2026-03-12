# Rivver Server

## 简介
Rivver Server 是一套基于 Bun + Elysia 的内容聚合与推荐后端，负责 RSS 订阅抓取、文章入库、用户行为记录、个性化推荐、以及用户资料与头像管理。认证采用 Better Auth 的 Cookie 会话，支持邮箱密码与 Google OAuth。

## 技术栈
- 运行时与框架：Bun、Elysia
- 数据库与 ORM：PostgreSQL、Drizzle ORM
- 认证：Better Auth（Session Cookie、Google OAuth、邮箱密码）
- RSS 抓取：rss-parser
- 向量生成：@xenova/transformers（gte-tiny）
- 图片处理：sharp
- 文档与类型：OpenAPI、elysia-remote-dts

## 运行方式
1. 安装依赖：`bun install`
2. 配置环境变量
3. 启动 API：`bun run dev`

生产构建：`bun run build`

## 环境变量
必填：
- `DATABASE_URL`：PostgreSQL 连接串
- `BETTER_AUTH_SECRET`：Better Auth 密钥
- `BETTER_AUTH_URL`：认证服务基础地址
- `GOOGLE_CLIENT_ID`：Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET`：Google OAuth Client Secret

可选：
- `TRUSTED_ORIGINS`：逗号分隔的允许跨域来源
- `PORT`：服务端口，默认 `3000`
- `NODE_ENV`：生产环境建议设为 `production`

## API 概览
认证与会话：
- `GET/POST /auth/*`：Better Auth 内置路由（登录、回调、获取会话、登出等）
- 前端调用受保护接口时需带 Cookie：`fetch(..., { credentials: 'include' })`

公开接口：
- `GET /article/:id`：文章详情
- `GET /article/popular`：热门文章
- `GET /feed/:id`：RSS 源详情
- `GET /feed/:id/articles`：RSS 源文章列表

需登录接口（Cookie 会话）：
- `GET /article/recommendation`：个性化推荐
- `GET /article/favorites`：收藏列表
- `POST /article/:id/favorite`、`DELETE /article/:id/favorite`、`GET /article/:id/favorite`
- `POST /article/:id/click`、`POST /article/:id/read-progress`、`POST /article/:id/share`
- `GET /subscription`、`POST /subscription`、`DELETE /subscription`
- `GET /feed/:id/subscription`
- `GET /profile`、`PUT /profile/avatar`、`GET /profile/avatar`

## 文档与类型
- OpenAPI：`/openapi`
- 类型声明：`/server.d.ts`

## 后台任务
API 内置定时任务每 24 小时触发一次 RSS 抓取与向量生成。

手动运行：
- `bun run worker:rss`：抓取 RSS 并入库
- `bun run worker:embedding`：为文章生成向量

## 数据库与迁移
Drizzle Schema 位于 `src/db/schema.ts`，脚本：
- `bun run db:push`：推送 schema
- `bun run db:pull`：拉取 schema
- `bun run db:studio`：启动 Drizzle Studio
