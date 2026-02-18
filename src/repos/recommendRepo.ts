import { db } from '@/db'
import { InsertUserRecommendation, userRecommendation } from '@/db/schema'

export const recommendRepo = {
  create: async (recommendation: InsertUserRecommendation) => {
    db.insert(userRecommendation)
      .values(recommendation)
      .onConflictDoUpdate({
        target: [userRecommendation.userId, userRecommendation.rank],
        set: { articleId: recommendation.articleId },
      })
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
}