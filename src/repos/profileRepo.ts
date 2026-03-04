import { db } from '@server/db'
import { profile, SelectProfile } from '@server/db/schema'
import { eq, sql } from 'drizzle-orm'

export const profileRepo = {
  create: async (data: Pick<SelectProfile, 'userId' | 'nickname'>): Promise<SelectProfile> => {
    const [row] = await db
      .insert(profile)
      .values(data)
      .returning()
    return row
  },
  findByUserId: async (userId: string): Promise<SelectProfile | undefined> => {
    return db.query.profile.findFirst({ where: { userId } })
  },
  updateNickname: async (userId: string, nickname: string) => {
    const [row] = await db
      .update(profile)
      .set({ nickname })
      .where(eq(profile.userId, userId))
      .returning()
    return row
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
  existsNickname: async (nickname: string, userId: string) => {
    return db.query.profile.findFirst({
      where: {
        AND: [
          { nickname: { eq: nickname } },
          { userId: { ne: userId } },
        ],
      },
      columns: { userId: true },
    })
  },
} as const
