import {
  boolean, bytea, index, integer, jsonb, pgEnum, pgTable, primaryKey, serial, text, timestamp, uuid, vector,
} from 'drizzle-orm/pg-core'

export const contentKindValues = ['article', 'image', 'video'] as const
export type ContentKind = typeof contentKindValues[number]
export const contentKindEnum = pgEnum('content_kind', contentKindValues)

export const user = pgTable.withRLS('user', {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().notNull().default(false),
  image: text(),
  username: text().unique(),
  passwordHash: text(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
})
export type SelectUser = typeof user.$inferSelect
export type InsertUser = typeof user.$inferInsert

export const session = pgTable.withRLS('session', {
  id: uuid().primaryKey().defaultRandom(),
  expiresAt: timestamp().notNull(),
  token: text().notNull().unique(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
  ipAddress: text(),
  userAgent: text(),
  userId: uuid().notNull().references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable.withRLS('account', {
  id: uuid().primaryKey().defaultRandom(),
  accountId: text().notNull(),
  providerId: text().notNull(),
  userId: uuid().notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text(),
  refreshToken: text(),
  idToken: text(),
  accessTokenExpiresAt: timestamp(),
  refreshTokenExpiresAt: timestamp(),
  scope: text(),
  password: text(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index('account_provider_account_idx').on(table.providerId, table.accountId),
  index('account_user_idx').on(table.userId),
])

export const verification = pgTable.withRLS('verification', {
  id: uuid().primaryKey().defaultRandom(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index('verification_identifier_idx').on(table.identifier),
])

export const profile = pgTable.withRLS('profile', {
  userId: uuid().references(() => user.id, { onDelete: 'cascade' }).primaryKey(),
  avatarBytes: bytea(),
  avatarMime: text().notNull().default('image/webp'),
  avatarHash: text(),
  avatarVersion: integer().notNull().default(1),
  avatarUpdatedAt: timestamp(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
})
export type SelectProfile = typeof profile.$inferSelect
export type InsertProfile = typeof profile.$inferInsert

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
  contentType: contentKindEnum().notNull().default('article'),
  articleContentCount: integer().notNull().default(0),
  imageContentCount: integer().notNull().default(0),
  videoContentCount: integer().notNull().default(0),
  subscriberCount: integer().default(0).notNull(),
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
  contentType: contentKindEnum().notNull().default('article'),
  // RSS <description>：通常是摘要
  summary: text(),
  // AI 生成摘要，避免与 RSS 摘要混用
  aiSummary: text(),
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
  'favorite',
  'share',
])

export const userBehavior = pgTable.withRLS('user_behavior', {
  id: serial().primaryKey(),
  userId: uuid().references(() => user.id, { onDelete: 'cascade' }).notNull(),
  articleId: integer().references(() => article.id, { onDelete: 'cascade' }).notNull(),
  type: behaviorEnum().notNull(),
  score: integer().notNull(),
  readProgress: integer(),
  createdAt: timestamp({ withTimezone: true }).defaultNow(),
}, (table) => [
  index('user_behavior_user_created_idx').on(table.userId, table.createdAt),
  index('user_behavior_article_created_idx').on(table.articleId, table.createdAt),
  index('user_behavior_user_type_created_idx').on(table.userId, table.type, table.createdAt),
  index('user_behavior_user_article_type_idx').on(table.userId, table.articleId, table.type),
])

export type SelectUserBehavior = typeof userBehavior.$inferSelect
export type InsertUserBehavior = typeof userBehavior.$inferInsert

export const userFavorite = pgTable.withRLS('user_favorite', {
  userId: uuid().references(() => user.id, { onDelete: 'cascade' }).notNull(),
  articleId: integer().references(() => article.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.articleId] }),
  index('user_favorite_user_created_idx').on(table.userId, table.createdAt),
])

export type SelectUserFavorite = typeof userFavorite.$inferSelect
export type InsertUserFavorite = typeof userFavorite.$inferInsert

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
  session,
  account,
  verification,
  profile,
  feed,
  subscription,
  article,
  userBehavior,
  userFavorite,
  userInterest,
  userRecommendation,
} as const
