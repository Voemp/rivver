import { Hono } from 'hono'
import * as z from 'zod'
import { jwt } from '../middlewares/jwt'
import { createSubService } from '../services/subService'
import { AppEnv } from '../types/env'
import { res } from '../types/response'
import { zValidator } from '../utils/validator'

const app = new Hono<AppEnv>()

app.use(jwt)

app.get('/', async (c) => {
  const subService = createSubService(c.var.db, c.var.jwtPayload)
  const subs = await subService.list()
  return c.json(res.success(subs), 200)
})

app.post('/', zValidator('json', z.object({
  url: z.url(),
  title: z.string().optional(),
})), async (c) => {
  const { url, title } = await c.req.json()
  const subService = createSubService(c.var.db, c.var.jwtPayload)
  const sub = await subService.subscribe(url, title)

  return c.json(res.success(sub), 201)
})

export default app
