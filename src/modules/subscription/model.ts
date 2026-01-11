import { t } from 'elysia'
import { db } from '../../database/model'

export namespace SubModel {
  const { feed, subscription } = db.insert

  export const subBody = t.Object({
    url: feed.url,
    title: subscription.title,
  })
  export type SubBody = typeof subBody.static

  export const unsubBody = t.Object({
    feedId: subscription.feedId,
  })
  export type UnsubBody = typeof unsubBody.static

  export const subResponse = t.Object({
    userId: subscription.userId,
    feedId: subscription.feedId,
    title: subscription.title,
    createdAt: subscription.createdAt,
  })

  export const unsubResponse = t.Object({
    feedId: subscription.feedId,
  })
}
