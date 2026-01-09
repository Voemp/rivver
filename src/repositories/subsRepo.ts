import { and, eq, sql } from 'drizzle-orm'
import { InsertSubscription, links, SelectLink, SelectSubscription, subscriptions } from '../db/schema'
import { DrizzleDB } from '../index'

export default (db = DrizzleDB.db) => ({
  create: async (sub: InsertSubscription): Promise<SelectSubscription> => {
    const [row] = await db
      .insert(subscriptions)
      .values(sub)
      .returning()
    return row
  },
  remove: async (userId: string, linkId: number) => {
    await db
      .delete(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.linkId, linkId),
        ),
      )
  },
  listByUser: async (userId: string): Promise<SelectLink[]> => {
    return db
      .select({
        id: links.id,
        url: links.url,
        title: sql<string>`COALESCE(
        ${subscriptions.title},
        ${links.title}
        )`,
        createdAt: links.createdAt,
      })
      .from(subscriptions)
      .innerJoin(links, eq(subscriptions.linkId, links.id))
      .where(eq(subscriptions.userId, userId))
  },
})
