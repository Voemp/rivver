import { res } from '@/types/response'
import jwt from '@elysiajs/jwt'
import { Elysia, status, t } from 'elysia'

export const jwtConfig = {
  name: 'jwt',
  secret: process.env.JWT_SECRET!,
  sub: undefined,
  exp: '7d',
}

export const AuthService = new Elysia({ name: 'Auth.Service' })
  .use(jwt(jwtConfig))
  .macro({
    isAuth: {
      resolve: async ({ jwt, headers: { authorization } }) => {
        const token = authorization?.replace('Bearer ', '')
        const payload = await jwt.verify(token)
        if (!payload || !payload.sub) return status(401, res.error('未授权', 'UNAUTHORIZED'))

        return { user: { id: payload.sub } }
      },
      user: t.Object({ id: t.String({ format: 'uuid' }) }),
    },
  })
