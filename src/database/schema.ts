import { boolean, index, integer, jsonb, pgTable, primaryKey, serial, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const user = pgTable('user', {
  id: uuid().primaryKey().defaultRandom(),
  username: text().notNull().unique(),
  passwordHash: text().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().defaultNow().$onUpdate(() => new Date()),
})
export type SelectUser = typeof user.$inferSelect
export type InsertUser = typeof user.$inferInsert

export const profile = pgTable('profile', {
  userId: uuid().references(() => user.id, { onDelete: 'cascade' }).primaryKey(),
  nickname: text().notNull().unique(),
  avatarUrl: text(),
})

export const feed = pgTable('feed', {
  id: serial().primaryKey(),
  url: text().notNull().unique(),
  title: text().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
})
export type SelectFeed = typeof feed.$inferSelect
export type InsertFeed = typeof feed.$inferInsert

export const subscription = pgTable('subscription', {
  userId: uuid().references(() => user.id, { onDelete: 'cascade' }).notNull(),
  feedId: integer().references(() => feed.id, { onDelete: 'cascade' }).notNull(),
  title: text(),
  createdAt: timestamp().notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.feedId] }),
])
export type SelectSubscription = typeof subscription.$inferSelect
export type InsertSubscription = typeof subscription.$inferInsert

export const article = pgTable('article', {
  id: serial().primaryKey(),
  feedId: integer().references(() => feed.id, { onDelete: 'cascade' }).notNull(),
  title: text(),
  link: text(),
  description: text(),
  author: text(),
  enclosure: jsonb().$type<{
    url: string
    length?: number
    type?: string
  }>(),
  guid: text(),
  guidIsPermalink: boolean().default(true),
  pubDate: timestamp({ withTimezone: true }),

  /** 原始 HTML / 内容块（详情页） */
  contentHtml: text('content_html'),
}, (table) => [
  index('articles_pub_date_idx').on(table.pubDate),
])

export const table = {
  user,
  feed,
  subscription,
  article,
} as const

export type Table = typeof table
