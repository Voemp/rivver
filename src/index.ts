import { Hono } from 'hono'
import { config as ZodConfig, ZodError } from 'zod'
import { zhCN } from 'zod/locales'
import { drizzleDB } from './middlewares/drizzle'
import auth from './routes/auth'
import { res } from './types/response'
import { AppError } from './utils/error'

ZodConfig(zhCN())

const app = new Hono()

app.use('*', drizzleDB)

app.route('/auth', auth)

app.onError((err, c) => {
  if (err instanceof ZodError) {
    return c.json(res.error(err.issues[0].message, 'VALIDATION_ERROR'), 400)
  }

  if (err instanceof AppError) {
    return c.json(res.error(err.message, err.code), err.statusCode)
  }

  console.error('Unexpected Error:', err)
  return c.json(res.error(err.message, 'INTERNAL_SERVER_ERROR'), 500)
})

export default app
