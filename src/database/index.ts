import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { relations } from './relations'

const client = postgres(process.env.DATABASE_URL!, { prepare: false })
export const db = drizzle({ client, relations, casing: 'snake_case' })
