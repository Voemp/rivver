import { DBModel } from '@server/db/model'
import { t } from 'elysia'

const { feedSelect } = DBModel

export const FeedModel = {
  feedParams: t.Object({
    id: t.Number(),
  }),
  feedResponse: feedSelect.schema,
  feedPopularQuery: t.Object({
    limit: t.Optional(t.Number({ minimum: 1, maximum: 12 })),
    contentType: t.Optional(t.UnionEnum(['article', 'image', 'video'], { default: undefined })),
  }),
  feedPopularResponse: t.Array(feedSelect.schema),
  subscriptionStatusResponse: t.Object({
    subscribed: t.Boolean(),
    feedId: t.Number(),
  }),
} as const
