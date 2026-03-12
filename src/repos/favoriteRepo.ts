import { db } from '@server/db'
import {
  type InsertUserBehavior, type InsertUserFavorite, type SelectUserFavorite, userBehavior, userFavorite,
} from '@server/db/schema'
import { and, eq } from 'drizzle-orm'

export const favoriteRepo = {
  create: async (favorite: InsertUserFavorite): Promise<SelectUserFavorite> => {
    const [row] = await db
      .insert(userFavorite)
      .values(favorite)
      .onConflictDoNothing()
      .returning()

    if (row) return row

    const existing = await db.query.userFavorite.findFirst({
      where: {
        userId: favorite.userId,
        articleId: favorite.articleId,
      },
    })

    return existing!
  },
  removeWithBehavior: async (userId: string, articleId: number): Promise<boolean> => {
    return db.transaction(async (tx) => {
      const [row] = await tx
        .delete(userFavorite)
        .where(and(eq(userFavorite.userId, userId), eq(userFavorite.articleId, articleId)))
        .returning({
          userId: userFavorite.userId,
        })

      if (!row) return false

      await tx
        .delete(userBehavior)
        .where(and(
          eq(userBehavior.userId, userId),
          eq(userBehavior.articleId, articleId),
          eq(userBehavior.type, 'favorite'),
        ))

      return true
    })
  },
  exists: async (userId: string, articleId: number): Promise<boolean> => {
    const row = await db.query.userFavorite.findFirst({
      where: {
        userId,
        articleId,
      },
    })

    return !!row
  },
  listByUser: async (userId: string, offset: number, limit: number) => {
    return db.query.userFavorite.findMany({
      where: {
        userId,
      },
      with: {
        article: {
          columns: {
            id: true,
            title: true,
            summary: true,
            enclosure: true,
            pubDate: true,
          },
          with: {
            feed: {
              columns: {
                title: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      offset,
      limit,
    }).then(rows => rows.map(r => r.article!).filter(Boolean))
  },
  createWithBehavior: async (
    favorite: InsertUserFavorite,
    behavior: InsertUserBehavior,
  ) => {
    return db.transaction(async (tx) => {
      await tx
        .insert(userFavorite)
        .values(favorite)
        .onConflictDoNothing()

      const [row] = await tx
        .insert(userBehavior)
        .values(behavior)
        .returning()

      return row
    })
  },
} as const
