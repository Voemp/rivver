import bcrypt from 'bcryptjs'
import { sign } from 'hono/jwt'
import { JWTPayload } from 'hono/utils/jwt/types'
import { NewUser, User, users } from '../db/schema'
import { Database } from '../types/env'
import { AppError } from '../utils/error'

export const createAuthService = (db: Database) => ({
  register: async (username: string, password: string, privateKey: string) => {
    const existing = await db.query.users.findFirst({ where: { username: username } })
    if (existing) throw new AppError('用户名已被占用', 'USERNAME_TAKEN', 409)

    const passwordHash = await bcrypt.hash(password, 10)
    const user: NewUser = {
      username,
      passwordHash
    }
    const [newUser] = await db.insert(users).values(user).returning()

    const payload = generatePayload(newUser)

    return await sign(payload, privateKey)
  },
  login: async (username: string, password: string, privateKey: string) => {
    const user = await db.query.users.findFirst({ where: { username: username } })
    if (!user) throw new AppError('用户名或密码错误', 'USERNAME_NOT_FOUND', 401)
    const isMatch = await bcrypt.compare(password, user.passwordHash)
    if (!isMatch) throw new AppError('用户名或密码错误', 'PASSWORD_NOT_MATCH', 401)

    const payload = generatePayload(user)
    return await sign(payload, privateKey)
  }
})

const generatePayload = (user: User): JWTPayload => {
  return {
    sub: user.id,
    username: user.username,
    role: 'user',
    // 统一设置过期时间：7天
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7
  }
}
