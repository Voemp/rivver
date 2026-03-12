import { DBModel } from '@server/db/model'
import { t } from 'elysia'

const { feedInsert, feedSelect, subscriptionInsert, subscriptionSelect } = DBModel

export const SubModel = {
  subBody: t.Object({
    url: feedInsert.url,
    title: subscriptionInsert.title,
  }),
  subResponse: t.Object({
    userId: subscriptionSelect.userId,
    feedId: subscriptionSelect.feedId,
    title: subscriptionSelect.title,
    createdAt: subscriptionSelect.createdAt,
  }),
  unsubBody: t.Object({
    feedId: subscriptionInsert.feedId,
  }),
  unsubResponse: t.Object({
    feedId: subscriptionSelect.feedId,
  }),
  listResponse: t.Array(feedSelect.schema),
} as const
