import { Hono } from 'hono'
import * as z from 'zod'
import { createAuthService } from '../services/authService'
import { Env } from '../types/env'
import { res } from '../types/response'
import { zValidator } from '../utils/validator'

const app = new Hono<Env>()

/**
 * 用户注册
 * @param username 用户名
 * @param password 密码（SHA-256）
 * @returns token
 */
app.post(
  '/register',
  zValidator('json', z.object({
    username: z.string().min(3).max(20),
    password: z.hash('sha256')
  })),
  async (c) => {
    const { username, password } = c.req.valid('json')
    const authService = createAuthService(c.var.db)
    const token = await authService.register(username, password, c.env.JWT_SECRET)

    return c.json(res.success(token), 201)
  }
)

/**
 * 用户登录
 * @param username 用户名
 * @param password 密码（SHA-256）
 * @returns token
 */
app.post(
  '/login',
  zValidator('json', z.object({
    username: z.string().min(3).max(20),
    password: z.hash('sha256')
  })),
  async (c) => {
    const { username, password } = c.req.valid('json')
    const authService = createAuthService(c.var.db)
    const token = await authService.login(username, password, c.env.JWT_SECRET)

    return c.json(res.success(token), 200)
  }
)

export default app
