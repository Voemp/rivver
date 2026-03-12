import { db } from '@server/db'
import { type InsertUserRecommendation, userRecommendation } from '@server/db/schema'
import { eq } from 'drizzle-orm'

export const recommendRepo = {
  create: async (recommendation: InsertUserRecommendation) => {
    await db.insert(userRecommendation)
      .values(recommendation)
      .onConflictDoUpdate({
        target: [userRecommendation.userId, userRecommendation.articleId],
        set: { rank: recommendation.rank },
      })
  },
  clearByUser: async (userId: string) => {
    await db.delete(userRecommendation)
      .where(eq(userRecommendation.userId, userId))
  },
  listByUser: async (userId: string, offset: number, limit: number) => {
    return db.query.userRecommendation.findMany({
      columns: { articleId: true },
      where: { userId },
      orderBy: { rank: 'asc' },
      offset: offset,
      limit: limit,
    }).then(rows => rows.map(r => r.articleId))
  },
} as const
