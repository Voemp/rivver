import { openapi } from '@elysiajs/openapi'
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
  .error({ AppError })
  .onError(({ error, code }) => {
    switch (code) {
      case 'AppError':
        return error.toResponse()
      case 'VALIDATION':
        return res.error(error.message, error.code)
    }
  })
  .guard({ response: { 400: ApiResponseModel.error, 409: ApiResponseModel.error } })
  .use(auth)
  .use(subscription)
  .use(article)
  .use(dev)
  .listen(3000)

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}\n` +
  `📖 Swagger UI: http://${app.server?.hostname}:${app.server?.port}/openapi`,
)
