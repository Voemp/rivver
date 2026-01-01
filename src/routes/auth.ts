import { Hono } from 'hono'
import * as z from 'zod'
import { authService } from '../services/authService'
import { AppEnv } from '../types/env'
import { res } from '../types/response'
import { zValidator } from '../utils/validator'

const app = new Hono<AppEnv>()

/**
 * 用户注册
 * @param username 用户名
 * @param password 密码（SHA-256）
 * @returns token
 */
app.post('/register', zValidator('json', z.object({
  username: z.string().min(3).max(20).regex(
    /^[a-zA-Z_][a-zA-Z0-9_]*$/,
    '用户名必须以字母或下划线开头，只能包含字母、数字和下划线',
  ),
  password: z.string().min(8).max(20),
})), async (c) => {
  const { username, password } = c.req.valid('json')
  const token = await authService.register(username, password, c.env.JWT_SECRET)

  return c.json(res.success(token), 201)
})

/**
 * 用户登录
 * @param username 用户名
 * @param password 密码（SHA-256）
 * @returns token
 */
app.post('/login', zValidator('json', z.object({
  username: z.string().min(3).max(20).regex(
    /^[a-zA-Z_][a-zA-Z0-9_]*$/,
    '用户名必须以字母或下划线开头，只能包含字母、数字和下划线',
  ),
  password: z.string().min(8).max(20),
})), async (c) => {
  const { username, password } = c.req.valid('json')
  const token = await authService.login(username, password, c.env.JWT_SECRET)

  return c.json(res.success(token), 200)
})

export default app
