import cors from '@elysiajs/cors'
import cron, { Patterns } from '@elysiajs/cron'
import { openapi } from '@elysiajs/openapi'
import { runEmbeddingGenerate } from '@server/worker/embedding'
import { runRssFetch } from '@server/worker/rss'
import { Elysia } from 'elysia'
import { version } from '../package.json'
import { article } from './modules/article'
import { auth, OpenAPI } from './modules/auth'
import { feed } from './modules/feed'
import { profile } from './modules/profile'
import { subscription } from './modules/subscription'
import { ApiResponseModel, res } from './types/response'
import { trustedOrigins } from './utils/cors'
import { AppError } from './utils/error'

const app = new Elysia()
  .use(openapi({
    documentation: {
      info: {
        title: 'Rivver Documentation',
        version: `${version}`,
      },
      tags: [
        { name: 'Profile', description: 'Profile endpoints' },
        { name: 'Subscription', description: 'Subscription endpoints' },
        { name: 'Article', description: 'Article endpoints' },
        { name: 'Feed', description: 'Feed endpoints' },
      ],
      components: {
        ...await OpenAPI.components,
        securitySchemes: {
          cookieAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: 'better-auth.session_token',
          },
        },
      },
      paths: await OpenAPI.getPaths(),
    },
  }))
  .use(cron({
    name: 'article-fetch',
    pattern: Patterns.everyHours(24),
    run() {
      void runRssFetch()
      void runEmbeddingGenerate()
    },
  }))
  .use(cors({
    origin: trustedOrigins.length > 0 ? trustedOrigins : true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  }))
  .error({ AppError })
  .onError(({ error, code }) => {
    switch (code) {
      case 'AppError':
        return error.toResponse()
      case 'VALIDATION':
        return res.error(error.all[0].message, error.code)
    }
  })
  .guard({ response: { 422: ApiResponseModel.error(undefined, 'VALIDATION') } })
  .mount(auth.handler)
  .use(profile)
  .use(subscription)
  .use(article)
  .use(feed)

app.listen(process.env.PORT ?? 3000, () => {
  console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}\n` +
    `📖 Swagger UI: http://${app.server?.hostname}:${app.server?.port}/openapi`,
  )
})

export type App = typeof app
