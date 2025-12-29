import { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type { JWTPayload } from 'hono/utils/jwt/types'
import { relations } from '../db/relations'

export type DrizzleDB = PostgresJsDatabase<Record<string, never>, typeof relations>

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
    db: DrizzleDB,
    jwtPayload: AppJWTPayload
  }
}
