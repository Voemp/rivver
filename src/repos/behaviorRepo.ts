import { db } from '@server/db'
import { InsertUserBehavior, SelectUserBehavior, userBehavior } from '@server/db/schema'

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
      orderBy: {
        readProgress: 'desc',
      },
    })

    return behavior?.readProgress ?? 0
  },
} as const
