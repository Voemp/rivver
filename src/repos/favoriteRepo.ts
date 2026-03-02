import { db } from '@server/db'
import {
  InsertUserBehavior, InsertUserFavorite, SelectUserFavorite, userBehavior, userFavorite,
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
  remove: async (userId: string, articleId: number): Promise<boolean> => {
    const [row] = await db
      .delete(userFavorite)
      .where(and(eq(userFavorite.userId, userId), eq(userFavorite.articleId, articleId)))
      .returning({
        userId: userFavorite.userId,
      })

    return !!row
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
