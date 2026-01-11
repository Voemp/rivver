import { and, eq, sql } from 'drizzle-orm'
import { db } from '../database'
import { feed, InsertSubscription, SelectFeed, SelectSubscription, subscription } from '../database/schema'

export const subRepo = {
  create: async (sub: InsertSubscription): Promise<SelectSubscription> => {
    const [row] = await db
      .insert(subscription)
      .values(sub)
      .returning()
    return row
  },
  remove: async (userId: string, feedId: number): Promise<Partial<SelectSubscription>> => {
    const [row] = await db
      .delete(subscription)
      .where(
        and(
          eq(subscription.userId, userId),
          eq(subscription.feedId, feedId),
        ),
      )
      .returning({
        feedId: subscription.feedId,
      })
    return row
  },
  listByUser: async (userId: string): Promise<SelectFeed[]> => {
    return db
      .select({
        id: feed.id,
        url: feed.url,
        title: sql<string>`COALESCE(
        ${subscription.title},
        ${feed.title}
        )`,
        createdAt: feed.createdAt,
      })
      .from(subscription)
      .innerJoin(feed, eq(subscription.feedId, feed.id))
      .where(eq(subscription.userId, userId))
  },
  findByUserAndLink: async (userId: string, feedId: number): Promise<SelectSubscription | undefined> => {
    return db.query.subscription.findFirst({
      where: {
        userId,
        feedId,
      },
    })
  },
}
