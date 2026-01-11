import jwt from '@elysiajs/jwt'
import Elysia, { status } from 'elysia'
import { res } from '../types/response'

export const jwtConfig = {
  name: 'jwt',
  secret: process.env.JWT_SECRET!,
  sub: undefined,
  exp: '7d',
}

export const auth = new Elysia()
  .use(jwt(jwtConfig))
  .derive({ as: 'global' }, async ({ jwt, headers: { authorization } }) => {
    const token = authorization?.replace('Bearer ', '')
    const payload = await jwt.verify(token)
    if (!payload || !payload.sub) return status(401, res.error('未授权', 'UNAUTHORIZED'))

    return { user: { id: payload.sub } }
  })
