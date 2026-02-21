import { db } from '@server/db'
import { feed, InsertFeed, SelectFeed } from '@server/db/schema'
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
  findByUrl: async (url: string): Promise<SelectFeed | undefined> => {
    return db.query.feed.findFirst({
      where: { url },
    })
  },
  update: async (id: number, newFeed: Partial<InsertFeed>) => {
    await db
      .update(feed)
      .set(newFeed)
      .where(eq(feed.id, id))
  },
} as const
