import { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { JWTPayload } from 'hono/utils/jwt/types'
import { relations } from '../db/relations'

export type Database = PostgresJsDatabase<Record<string, never>, typeof relations>

export type Env = {
  Bindings: {
    DATABASE_URL: string,
    JWT_SECRET: string
  }
  Variables: {
    db: Database,
    jwtPayload: JWTPayload
  }
}
