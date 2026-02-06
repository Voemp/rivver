import { t } from 'elysia'
import { DBModel } from '../../database/model'

export namespace SubModel {
  const { feedInsert, feedSelect, subscriptionInsert, subscriptionSelect } = DBModel

  export const subBody = t.Object({
    url: feedInsert.url,
    title: subscriptionInsert.title,
  })
  export type SubBody = typeof subBody.static

  export const unsubBody = t.Object({
    feedId: subscriptionInsert.feedId,
  })
  export type UnsubBody = typeof unsubBody.static

  export const subResponse = t.Object({
    userId: subscriptionSelect.userId,
    feedId: subscriptionSelect.feedId,
    title: subscriptionSelect.title,
    createdAt: subscriptionSelect.createdAt,
  })

  export const unsubResponse = t.Object({
    feedId: subscriptionSelect.feedId,
  })

  export const listResponse = t.Array(feedSelect.schema)
}
