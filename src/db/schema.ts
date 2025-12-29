import { integer, pgTable, primaryKey, serial, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),
  username: varchar({ length: 255 }).notNull().unique(),
  passwordHash: varchar({ length: 255 }).notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().defaultNow().$onUpdate(() => new Date()),
})
export type SelectUser = typeof users.$inferSelect
export type InsertUser = typeof users.$inferInsert

export const profiles = pgTable('profiles', {
  userId: uuid().references(() => users.id, { onDelete: 'cascade' }).primaryKey(),
  nickname: text().notNull().unique(),
  avatarUrl: text(),
})

export const links = pgTable('links', {
  id: serial().primaryKey(),
  url: text().notNull().unique(),
  title: text().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
})
export type SelectLink = typeof links.$inferSelect
export type InsertLink = typeof links.$inferInsert

export const subscriptions = pgTable('subscriptions', {
  userId: uuid().references(() => users.id, { onDelete: 'cascade' }).notNull(),
  linkId: integer().references(() => links.id, { onDelete: 'cascade' }).notNull(),
  title: text(),
  createdAt: timestamp().notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.linkId] }),
])
export type SelectSubscription = typeof subscriptions.$inferSelect
export type InsertSubscription = typeof subscriptions.$inferInsert

