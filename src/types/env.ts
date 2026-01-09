import type { JWTPayload } from 'hono/utils/jwt/types'

export interface AppJWTPayload extends JWTPayload {
  sub: string,
  username: string
}

export type AppEnv = {
  Bindings: {
    DATABASE_URL: string,
    JWT_SECRET: string
  }
  Variables: {
    jwtPayload: AppJWTPayload
  }
}
