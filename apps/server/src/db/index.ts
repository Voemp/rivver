import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { relations } from './relations'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('缺少 DATABASE_URL 环境变量')
}

const client = postgres(databaseUrl, { prepare: false })
export const db = drizzle({ client, relations })
