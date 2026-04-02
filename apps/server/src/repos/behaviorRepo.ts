import { db } from '@server/db'
import { article, type InsertUserBehavior, type SelectUserBehavior, userBehavior } from '@server/db/schema'
import { and, desc, eq, gt } from 'drizzle-orm'

export const behaviorRepo = {
  create: async (newBehavior: InsertUserBehavior): Promise<SelectUserBehavior> => {
    const [row] = await db
      .insert(userBehavior)
      .values(newBehavior)
      .returning()

    return row
  },
  existsByUserArticleType: async (
    userId: string,
    articleId: number,
    type: InsertUserBehavior['type'],
  ): Promise<boolean> => {
    const row = await db.query.userBehavior.findFirst({
      where: {
        userId,
        articleId,
        type,
      },
    })

    return !!row
  },
  findMaxReadProgress: async (userId: string, articleId: number): Promise<number> => {
    const behavior = await db.query.userBehavior.findFirst({
      where: {
        userId,
        articleId,
        type: 'read',
      },
    })

    return behavior?.readProgress ?? 0
  },
  updateReadProgress: async (
    userId: string,
    articleId: number,
    newBehavior: Partial<InsertUserBehavior>,
  ): Promise<void> => {
    await db
      .update(userBehavior)
      .set(newBehavior)
      .where(and(
        eq(userBehavior.userId, userId),
        eq(userBehavior.articleId, articleId),
        eq(userBehavior.type, 'read'),
      ))
  },
  listWeightedSignals: async (userId: string, limit: number) => {
    return db
      .select({
        articleId: userBehavior.articleId,
        score: userBehavior.score,
        createdAt: userBehavior.createdAt,
        feedId: article.feedId,
        contentType: article.contentType,
        embedding: article.embedding,
      })
      .from(userBehavior)
      .innerJoin(article, eq(userBehavior.articleId, article.id))
      .where(and(
        eq(userBehavior.userId, userId),
        gt(userBehavior.score, 0),
      ))
      .orderBy(desc(userBehavior.createdAt))
      .limit(limit)
  },
  listWeightedForInterest: async (userId: string, limit: number) => {
    return behaviorRepo
      .listWeightedSignals(userId, limit)
      .then(rows => rows.filter(row => row.embedding && row.embedding.length > 0))
  },
  listSeenArticleIds: async (userId: string, limit = 500) => {
    return db
      .select({
        articleId: userBehavior.articleId,
      })
      .from(userBehavior)
      .where(eq(userBehavior.userId, userId))
      .orderBy(desc(userBehavior.createdAt))
      .limit(limit)
      .then(rows => Array.from(new Set(rows.map(row => row.articleId))))
  },
} as const
