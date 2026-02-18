import {
  index, integer, jsonb, pgEnum, pgTable, primaryKey, serial, text, timestamp, uuid, vector,
} from 'drizzle-orm/pg-core'

export const user = pgTable.withRLS('user', {
  id: uuid().primaryKey().defaultRandom(),
  username: text().notNull().unique(),
  passwordHash: text().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().defaultNow().$onUpdate(() => new Date()),
})
export type SelectUser = typeof user.$inferSelect
export type InsertUser = typeof user.$inferInsert

export const profile = pgTable.withRLS('profile', {
  userId: uuid().references(() => user.id, { onDelete: 'cascade' }).primaryKey(),
  nickname: text().notNull().unique(),
  avatarUrl: text(),
})

export const statusEnum = pgEnum('status', [
  'active',
  'pending',
  'blocked',
])

export const feed = pgTable.withRLS('feed', {
  id: serial().primaryKey(),
  url: text().notNull().unique(),
  title: text().notNull(),
  description: text(),
  link: text(),
  image: text(),
  subscriberCount: integer().default(0),
  status: statusEnum().default('active').notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  lastFetchedAt: timestamp(),
})
export type SelectFeed = typeof feed.$inferSelect
export type InsertFeed = typeof feed.$inferInsert

export const subscription = pgTable.withRLS('subscription', {
  userId: uuid().references(() => user.id, { onDelete: 'cascade' }).notNull(),
  feedId: integer().references(() => feed.id, { onDelete: 'cascade' }).notNull(),
  title: text(),
  createdAt: timestamp().notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.feedId] }),
])
export type SelectSubscription = typeof subscription.$inferSelect
export type InsertSubscription = typeof subscription.$inferInsert

export const article = pgTable.withRLS('article', {
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
  embedding: vector({ dimensions: 384 }),
  readCount: integer().default(0),
  pubDate: timestamp({ withTimezone: true }),
  createdAt: timestamp().notNull().defaultNow(),
}, (table) => [
  index('articles_pub_date_idx').on(table.pubDate),
  index('embedding_idx').using('hnsw', table.embedding.op('vector_cosine_ops')),
])
export type SelectArticle = typeof article.$inferSelect
export type InsertArticle = typeof article.$inferInsert

export const behaviorEnum = pgEnum('behavior', [
  'click',
  'read',
  'collect',
  'share',
])

export const userBehavior = pgTable.withRLS('user_behavior', {
  id: serial().primaryKey(),
  userId: uuid().references(() => user.id, { onDelete: 'cascade' }).notNull(),
  articleId: integer().references(() => article.id, { onDelete: 'cascade' }).notNull(),
  type: behaviorEnum().notNull(),
  score: integer().notNull(), // click=1, read=3, collect=5, share=8
  progress: integer().default(0), // 阅读进度百分比
  createdAt: timestamp().defaultNow(),
})

export const userInterest = pgTable.withRLS('user_interest', {
  userId: uuid().primaryKey().references(() => user.id, { onDelete: 'cascade' }),
  interestVector: vector({ dimensions: 384 }).notNull(),
  articleCount: integer().default(0), // 用于衰减
  updatedAt: timestamp().defaultNow(),
})

export const userRecommendation = pgTable.withRLS('user_recommendation', {
  userId: uuid().references(() => user.id, { onDelete: 'cascade' }).notNull(),
  articleId: integer().references(() => article.id, { onDelete: 'cascade' }).notNull(),
  rank: integer().notNull(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.articleId] }),
  index('user_rank_idx').on(table.userId, table.rank),
])
export type InsertUserRecommendation = typeof userRecommendation.$inferInsert

export const table = {
  user,
  profile,
  feed,
  subscription,
  article,
  userBehavior,
  userInterest,
  userRecommendation,
} as const

export type Table = typeof table
