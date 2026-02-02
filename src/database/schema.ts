import { index, integer, jsonb, pgEnum, pgTable, primaryKey, serial, text, timestamp, uuid } from 'drizzle-orm/pg-core'

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

export const statusEnum = pgEnum('status', [
  'active',
  'pending',
  'blocked',
])

export const feed = pgTable('feed', {
  id: serial().primaryKey(),
  url: text().notNull().unique(),
  title: text().notNull(),
  description: text(),
  link: text(),
  image: text(),
  subscriberCount: integer().default(0),
  status: statusEnum('status').default('active').notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  lastFetchedAt: timestamp(),
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
  // RSS <description>：通常是摘要
  summary: text(),
  // <content:encoded>: 全文 HTML
  content: text(),
  // 纯文本内容（用于搜索 / NLP）
  contentSnippet: text(),
  author: text(),
  enclosure: jsonb().$type<{
    url: string
    length?: number
    type?: string
  }>(),
  guid: text(),
  pubDate: timestamp({ withTimezone: true }),
}, (table) => [
  index('articles_pub_date_idx').on(table.pubDate),
])
export type SelectArticle = typeof article.$inferSelect
export type InsertArticle = typeof article.$inferInsert


export const table = {
  user,
  feed,
  subscription,
  article,
} as const

export type Table = typeof table
