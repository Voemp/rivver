import { t } from 'elysia'
import { table } from './schema'
import { createModel } from './utils'

export const DBModel = createModel(table, {
  feed: {
    url: t.String({ format: 'uri' }),
    link: t.Nullable(t.String({ format: 'uri' })),
  },
  subscription: {
    status: t.UnionEnum(['active', 'pending', 'blocked']),
  },
  article: {
    link: t.Nullable(t.String({ format: 'uri' })),
    enclosure: t.Nullable(t.Object({
      url: t.String({ format: 'uri' }),
      length: t.Optional(t.Number()),
      type: t.Optional(t.String()),
    })),
    pubDate: t.Nullable(t.Date()),
    createdAt: t.Date(),
  },
})
