# Rivver

Rivver 是一个面向 RSS 场景的全栈内容聚合与个性化推荐项目。它保留 RSS 的开放性和可控性，同时补上现代内容平台才常见的推荐、搜索、行为建模和阅读体验能力。

项目目前包含两个应用：

- `apps/server`：Bun + Elysia API 服务
- `apps/web`：Vite + React Web 客户端

## 项目定位

传统 RSS 阅读器擅长订阅和时间流展示，但不擅长内容筛选；主流文字和视频平台擅长推荐，但内容来源封闭、用户可控性弱。

Rivver 的目标是把这两类产品的优点结合起来：

- 内容来源开放，基于 RSS 订阅
- 首页不是纯时间线，而是个性化推荐流
- 同时支持文章、图片、视频、音频附件等内容形态
- 推荐依据来自真实阅读行为，而不是平台私域分发逻辑

一句话概括：

**Rivver 是一个带推荐系统的 RSS 智能阅读器。**

## 当前功能

### 核心业务

- RSS 订阅管理：新增订阅、取消订阅、查看订阅列表
- RSS 抓取与入库：定时抓取所有 feed，并支持新增订阅后立即异步抓取
- 内容标准化：统一保存标题、摘要、正文、正文片段、媒体信息等字段
- 内容类型识别：自动区分 `article`、`image`、`video`
- 个性化推荐：基于用户行为、兴趣向量、来源偏好、内容类型偏好和热度进行排序
- 热门推荐：为匿名用户和冷启动用户提供热门内容流
- 收藏系统：支持收藏、取消收藏、查看收藏列表
- 搜索系统：支持标题、摘要、正文片段检索
- AI 摘要：为文章生成中文要点摘要
- 阅读体验：阅读进度记录、目录进度、音频附件播放、媒体内容详情展示

### 账户与资料

- Better Auth 认证
- 邮箱密码登录
- Google OAuth 登录
- Cookie 会话鉴权
- 用户头像上传、裁剪、压缩与缓存控制

### 工程能力

- OpenAPI 文档
- 定时任务：RSS 抓取与 embedding 生成
- PostgreSQL + pgvector 向量存储
- Turborepo monorepo 管理

## 推荐系统概览

Rivver 的重点不是单纯“展示 RSS”，而是把 RSS 内容做成可推荐、可学习的内容流。

推荐链路大致如下：

1. 抓取 RSS 内容并入库
2. 为文章生成 384 维 embedding
3. 记录用户点击、阅读、收藏、分享行为
4. 根据行为生成用户兴趣向量和偏好画像
5. 对候选内容进行混合排序与多样性重排
6. 将结果写入推荐表并分页返回给前端

### 用户行为信号

当前系统采集四类行为：

- `click`
- `read`
- `favorite`
- `share`

基础分值如下：

- 点击：`1`
- 阅读：按阅读进度计算，范围 `1 ~ 4`
- 收藏：`6`
- 分享：`8`

行为会进行时间衰减，因此近期兴趣比历史兴趣更重要。

### 内容理解

服务端使用 `@huggingface/transformers` 的 `TaylorAI/gte-tiny` 模型生成文章 embedding，向量维度为 `384`。

生成输入基于：

- 文章标题
- 正文摘要前 200 字

向量写入 PostgreSQL 的 `vector(384)` 字段，并使用 HNSW 索引支持相似度计算。

### 排序逻辑

推荐排序不是单一算法，而是多种信号混合：

- 语义相似度
- feed 长期偏好
- feed 近期偏好
- 内容类型长期偏好
- 内容类型近期偏好
- 热度与新鲜度

其中：

- 长文内容更依赖语义相似度
- 图片和视频更依赖近期偏好与热度
- 系统会做多样性重排，避免同一来源或同一类型内容连续出现
- 当个性化数据不足时，会自动回退到热门推荐

## 技术栈

### 服务端

- Bun
- Elysia
- PostgreSQL
- Drizzle ORM
- Better Auth
- rss-parser
- @huggingface/transformers
- sharp
- OpenAPI

### 前端

- React 19
- Vite 8
- TanStack Router
- TanStack Query
- Tailwind CSS v4
- Radix UI / shadcn
- react-hook-form
- zod

### 工程化

- Turborepo
- TypeScript

## 目录结构

```text
rivver/
├─ apps/
│  ├─ server/   # Bun + Elysia API 服务
│  └─ web/      # React + Vite Web 客户端
├─ package.json
├─ turbo.json
└─ README.md
```

## 快速开始

### 1. 安装依赖

在仓库根目录执行：

```bash
bun install
```

### 2. 配置环境变量

#### 服务端 `apps/server`

必需：

- `DATABASE_URL`：PostgreSQL 连接串
- `BETTER_AUTH_SECRET`：Better Auth 密钥
- `BETTER_AUTH_URL`：认证服务基础地址，例如 `http://localhost:3000`
- `GOOGLE_CLIENT_ID`：Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET`：Google OAuth Client Secret

可选：

- `TRUSTED_ORIGINS`：允许跨域来源，逗号分隔
- `PORT`：服务端端口，默认 `3000`
- `NODE_ENV`：生产环境建议设为 `production`

AI 摘要相关，可选：

- `AI_SUMMARY_API_KEY`
- `AI_SUMMARY_MODEL`
- `AI_SUMMARY_BASE_URL`：默认 `https://api.openai.com/v1`

#### 前端 `apps/web`

- `VITE_API_BASE_URL`：API 基础地址，默认 `http://localhost:3000`
- `VITE_APP_NAME`：应用名称，默认 `Rivver RSS`
- `VITE_RECOMMENDATION_PAGE_SIZE`：列表分页大小，默认 `12`

### 3. 启动开发环境

在仓库根目录执行：

```bash
bun run dev
```

这会通过 Turborepo 同时启动服务端和前端。

### 4. 分别启动子应用

服务端：

```bash
cd apps/server
bun run dev
```

前端：

```bash
cd apps/web
bun run dev
```

### 5. 构建

在仓库根目录执行：

```bash
bun run build
```

### 6. 类型检查

在仓库根目录执行：

```bash
bun run check-types
```

## 数据库与后台任务

Drizzle Schema 位于：

- `apps/server/src/db/schema.ts`

在 `apps/server` 目录可执行：

```bash
bun run db:push
bun run db:pull
bun run db:studio
```

后台任务：

- `bun run worker:rss`：抓取 RSS 内容
- `bun run worker:embedding`：生成文章向量

同时，API 服务自身也会每 24 小时自动触发一次：

- RSS 抓取
- embedding 生成

## API 概览

### 认证与会话

- `GET/POST /auth/*`

前端访问受保护接口时需携带 Cookie。

### 公开接口

- `GET /article/:id`
- `POST /article/:id/ai-summary`
- `GET /article/popular`
- `GET /article/search`
- `GET /feed/popular`
- `GET /feed/:id`
- `GET /feed/:id/articles`

### 需登录接口

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

## 前端页面

当前 Web 端主要包含以下页面：

- 首页：推荐流 / 热门流
- 文章详情页
- Feed 详情页
- 搜索页
- 收藏页
- 订阅页

首页结构上分为：

- 精选内容区
- 流式内容区
- Feed 推荐侧栏

文章详情页支持：

- 普通文章布局
- 图片 / 视频媒体布局
- AI 摘要
- 阅读进度跟踪
- 目录高亮
- 收藏、分享、订阅联动

## 服务文档

服务启动后可访问：

- OpenAPI：`/openapi`

## 当前已完成与后续方向

### 已完成

- RSS 聚合与订阅管理
- 个性化推荐主链路
- 热门推荐与冷启动补位
- 搜索、收藏、阅读进度、分享、AI 摘要
- 用户认证与头像资料管理
- 前后端联调与基础工程化能力

### 后续可继续优化

- 引入更多真实数据验证推荐效果
- 进一步优化冷启动推荐质量
- 增强搜索的语义能力
- 完善测试、监控和部署能力

## License
Apache License 2.0
