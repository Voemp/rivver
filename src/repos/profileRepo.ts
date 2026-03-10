import { db } from '@server/db'
import { profile, SelectProfile } from '@server/db/schema'
import { eq, sql } from 'drizzle-orm'

export const profileRepo = {
  create: async (data: Pick<SelectProfile, 'userId'>): Promise<SelectProfile> => {
    const [row] = await db
      .insert(profile)
      .values(data)
      .returning()
    return row
  },
  findByUserId: async (userId: string): Promise<SelectProfile | undefined> => {
    return db.query.profile.findFirst({ where: { userId } })
  },
  updateAvatar: async (userId: string, avatarBytes: Buffer, avatarHash: string, avatarMime: string) => {
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
