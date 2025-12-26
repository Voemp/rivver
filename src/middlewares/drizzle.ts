import { drizzle } from 'drizzle-orm/postgres-js'
import { createMiddleware } from 'hono/factory'
import postgres from 'postgres'
import { relations } from '../db/relations'

export const drizzleDB = createMiddleware(async (c, next) => {
  const client = postgres(c.env.DATABASE_URL, { prepare: false })
  const db = drizzle({ client, relations, casing: 'snake_case' })
  c.set('db', db)
  await next()
})
