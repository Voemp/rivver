import { Hono } from 'hono'
import * as z from 'zod'
import { jwt } from '../middlewares/jwt'
import { subService } from '../services/subService'
import { AppEnv } from '../types/env'
import { res } from '../types/response'
import { zValidator } from '../utils/validator'

const app = new Hono<AppEnv>()

app.use(jwt)

app.get('/', async (c) => {
  const userId = c.var.jwtPayload.sub
  const subs = await subService.list(userId)

  return c.json(res.success(subs), 200)
})

app.post('/', zValidator('json', z.object({
  url: z.url(),
  title: z.string().optional(),
})), async (c) => {
  const { url, title } = c.req.valid('json')
  const userId = c.var.jwtPayload.sub
  const sub = await subService.subscribe(userId, url, title)

  return c.json(res.success(sub), 201)
})

app.delete('/', zValidator('json', z.object({
  linkId: z.number(),
})), async (c) => {
  const { linkId } = c.req.valid('json')
  const userId = c.var.jwtPayload.sub
  await subService.unsubscribe(userId, linkId)

  return c.json(res.success(linkId), 200)
})

export default app
