import { DBModel } from '@server/db/model'
import { t } from 'elysia'

const { feedSelect } = DBModel

export const FeedModel = {
  feedParams: t.Object({
    id: t.Number(),
  }),
  feedResponse: feedSelect.schema,
  subscriptionStatusResponse: t.Object({
    subscribed: t.Boolean(),
    feedId: t.Number(),
  }),
} as const