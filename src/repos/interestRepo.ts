import { db } from '@server/db'
import { userInterest } from '@server/db/schema'
import { eq } from 'drizzle-orm'

export const interestRepo = {
  findByUser: async (userId: string) => {
    return db.query.userInterest.findFirst({
      where: { userId },
    })
  },
  upsert: async (userId: string, interestVector: number[], articleCount: number) => {
    const [row] = await db.insert(userInterest)
      .values({
        userId,
        interestVector,
        articleCount,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [userInterest.userId],
        set: {
          interestVector,
          articleCount,
          updatedAt: new Date(),
        },
      })
      .returning()

    return row
  },
  touchEmpty: async (userId: string) => {
    await db.update(userInterest)
      .set({ updatedAt: new Date() })
      .where(eq(userInterest.userId, userId))
  },
} as const
