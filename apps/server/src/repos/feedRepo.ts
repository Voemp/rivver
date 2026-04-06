import { db } from '@server/db'
import { type ContentKind, feed, type InsertFeed, type SelectFeed } from '@server/db/schema'
import { eq } from 'drizzle-orm'

export const feedRepo = {
  create: async (newFeed: InsertFeed): Promise<SelectFeed> => {
    const [row] = await db
      .insert(feed)
      .values(newFeed)
      .returning()
    return row
  },
  list: async () => {
    return db.query.feed.findMany()
  },
  findById: async (id: number): Promise<SelectFeed | undefined> => {
    return db.query.feed.findFirst({
      where: { id },
    })
  },
  findByUrl: async (url: string): Promise<SelectFeed | undefined> => {
    return db.query.feed.findFirst({
      where: { url },
    })
  },
  listPopular: async (limit: number, contentType?: ContentKind): Promise<SelectFeed[]> => {
    const feeds = await db.query.feed.findMany({
      where: contentType
        ? {
          status: 'active',
          contentType,
        }
        : {
          status: 'active',
        },
    })

    return feeds
      .sort((a, b) => {
        const subscriberDelta = (b.subscriberCount ?? 0) - (a.subscriberCount ?? 0)
        if (subscriberDelta !== 0) return subscriberDelta

        const totalContentA = a.articleContentCount + a.imageContentCount + a.videoContentCount
        const totalContentB = b.articleContentCount + b.imageContentCount + b.videoContentCount
        if (totalContentB !== totalContentA) return totalContentB - totalContentA

        const fetchedDelta = (b.lastFetchedAt?.getTime() ?? 0) - (a.lastFetchedAt?.getTime() ?? 0)
        if (fetchedDelta !== 0) return fetchedDelta

        return b.id - a.id
      })
      .slice(0, limit)
  },
  update: async (id: number, newFeed: Partial<InsertFeed>) => {
    await db
      .update(feed)
      .set(newFeed)
      .where(eq(feed.id, id))
  },
} as const
