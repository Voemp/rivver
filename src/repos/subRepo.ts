import { db } from '@server/db'
import { feed, InsertSubscription, SelectFeed, SelectSubscription, subscription } from '@server/db/schema'
import { and, eq, sql } from 'drizzle-orm'

export const subRepo = {
  create: async (sub: InsertSubscription): Promise<SelectSubscription> => {
    return db.transaction(async (tx) => {
      const [row] = await tx
        .insert(subscription)
        .values(sub)
        .returning()

      await tx
        .update(feed)
        .set({ subscriberCount: sql`${feed.subscriberCount} + 1` })
        .where(eq(feed.id, sub.feedId))

      return row
    })
  },
  remove: async (userId: string, feedId: number): Promise<Partial<SelectSubscription>> => {
    return db.transaction(async (tx) => {
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

      await tx
        .update(feed)
        .set({ subscriberCount: sql`${feed.subscriberCount} - 1` })
        .where(eq(feed.id, feedId))

      return row
    })
  },
  listByUser: async (userId: string): Promise<SelectFeed[]> => {
    return db
      .select({
        id: feed.id,
        url: feed.url,
        title: sql<string>`COALESCE(${subscription.title}, ${feed.title})`,
        description: feed.description,
        link: feed.link,
        image: feed.image,
        subscriberCount: feed.subscriberCount,
        status: feed.status,
        createdAt: feed.createdAt,
        lastFetchedAt: feed.lastFetchedAt,
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
