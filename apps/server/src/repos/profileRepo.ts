import { db } from '@server/db'
import { type InsertProfile, profile, type SelectProfile } from '@server/db/schema'
import { eq, sql } from 'drizzle-orm'

export const profileRepo = {
  create: async (data: Pick<InsertProfile, 'userId'>): Promise<SelectProfile> => {
    const [row] = await db.insert(profile).values(data).returning()
    if (!row) throw new Error('用户资料创建失败')
    return row
  },
  findByUserId: async (userId: string): Promise<SelectProfile | undefined> => {
    return db.query.profile.findFirst({ where: { userId } })
  },
  updateAvatar: async (
    userId: string,
    avatarBytes: Buffer,
    avatarHash: string,
    avatarMime: string,
  ) => {
    const [row] = await db
      .update(profile)
      .set({
        avatarBytes,
        avatarHash,
        avatarMime,
        avatarUpdatedAt: new Date(),
        avatarVersion: sql`${profile.avatarVersion} + 1`,
      })
      .where(eq(profile.userId, userId))
      .returning()
    return row
  },
} as const
