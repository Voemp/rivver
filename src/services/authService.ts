import bcrypt from 'bcryptjs'
import { sign } from 'hono/jwt'
import { InsertUser, SelectUser } from '../db/schema'
import { createUserRepo } from '../repositories/user.repo'
import { AppJWTPayload, DrizzleDB } from '../types/env'
import { AppError } from '../utils/error'

export const createAuthService = (db: DrizzleDB) => {
  const userRepo = createUserRepo(db)

  return {
    register: async (username: string, password: string, privateKey: string) => {
      const existing = await userRepo.findByUsername(username)
      if (existing) throw new AppError('用户名已被占用', 'USERNAME_TAKEN', 409)

      const passwordHash = await bcrypt.hash(password, 10)
      const user: InsertUser = {
        username,
        passwordHash,
      }
      const newUser = await userRepo.create(user)

      const payload = generatePayload(newUser)
      return await sign(payload, privateKey)
    },
    login: async (username: string, password: string, privateKey: string) => {
      const user = await userRepo.findByUsername(username)
      if (!user) throw new AppError('用户名或密码错误', 'USERNAME_NOT_FOUND', 401)
      const isMatch = await bcrypt.compare(password, user.passwordHash)
      if (!isMatch) throw new AppError('用户名或密码错误', 'PASSWORD_NOT_MATCH', 401)

      const payload = generatePayload(user)
      return await sign(payload, privateKey)
    },
  }
}

const generatePayload = (user: SelectUser): AppJWTPayload => {
  return {
    sub: user.id,
    username: user.username,
    role: 'user',
    // 统一设置过期时间：7天
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
  }
}
