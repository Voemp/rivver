import { db } from '../database'
import { userRecommendation } from '../database/schema'

export const recommendRepo = {
  create: async (userId: string, articleId: number, rank: number) => {
    db.insert(userRecommendation)
      .values({ userId, articleId, rank })
      .onConflictDoUpdate({
        target: [userRecommendation.userId, userRecommendation.rank],
        set: { articleId },
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