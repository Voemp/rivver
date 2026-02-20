import cron, { Patterns } from '@elysiajs/cron'
import { openapi } from '@elysiajs/openapi'
import { runEmbeddingGenerate } from '@server/worker/embedding'
import { runRssFetch } from '@server/worker/rss'
import { Elysia } from 'elysia'
import { article } from './modules/article'
import { auth } from './modules/auth'
import { dev } from './modules/dev'
import { subscription } from './modules/subscription'
import { ApiResponseModel, res } from './types/response'
import { AppError } from './utils/error'

const app = new Elysia()
  .use(openapi({
    documentation: {
      info: {
        title: 'Rivver Documentation',
        version: '1.0.0',
      },
      tags: [
        { name: 'Auth', description: 'Authentication endpoints' },
        { name: 'Subscription', description: 'Subscription endpoints' },
        { name: 'Article', description: 'Article endpoints' },
        { name: 'Dev', description: 'Dev endpoints' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  }))
  .use(cron({
    name: 'article-fetch',
    pattern: Patterns.everyHours(6),
    run() {
      void runRssFetch()
      void runEmbeddingGenerate()
    },
  }))
  .error({ AppError })
  .onError(({ error, code }) => {
    switch (code) {
      case 'AppError':
        return error.toResponse()
      case 'VALIDATION':
        return res.error(JSON.parse(error.message).message, error.code)
    }
  })
  .guard({ response: { 400: ApiResponseModel.error, 409: ApiResponseModel.error } })
  .use(auth)
  .use(subscription)
  .use(article)
  .use(dev)

app.listen(process.env.PORT ?? 3000, () => {
  console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}\n` +
    `📖 Swagger UI: http://${app.server?.hostname}:${app.server?.port}/openapi`,
  )
})

export default app
