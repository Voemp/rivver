import { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),
  username: varchar({ length: 255 }).notNull().unique(),
  passwordHash: varchar({ length: 255 }).notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().defaultNow().$onUpdate(() => new Date())
})
export type User = InferSelectModel<typeof users>
export type NewUser = InferInsertModel<typeof users>

export const profiles = pgTable('profiles', {
  userId: uuid().references(() => users.id).primaryKey(),
  nickname: text().notNull().unique(),
  avatarUrl: text()
})
