import { Elysia } from 'elysia'
import { auth } from './modules/auth'
import { dev } from './modules/dev'
import { subscription } from './modules/subscription'
import { ApiResponseModel, res } from './types/response'
import { AppError } from './utils/error'

const app = new Elysia()
  .error({ AppError })
  .onError(({ error, code }) => {
    switch (code) {
      case 'AppError':
        return error
      case 'VALIDATION':
        return res.error(error.message, error.code)
    }
  })
  .guard({ response: { 400: ApiResponseModel.error, 409: ApiResponseModel.error } })
  .use(auth)
  .use(subscription)
  .use(dev)
  .listen(3000)

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
)
