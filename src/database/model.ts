import { createInsertSchema, createSelectSchema } from 'drizzle-typebox'
import { t } from 'elysia'
import { table } from './schema'
import { spreads } from './utils'

export const DBModel = {
  insert: spreads({
    user: table.user,
    feed: createInsertSchema(table.feed, {
      url: t.String({ format: 'uri' }),
    }),
    subscription: table.subscription,
  }, 'insert'),
  select: spreads({
    user: table.user,
    feed: createSelectSchema(table.feed, {
      url: t.String({ format: 'uri' }),
    }),
    subscription: table.subscription,
  }, 'select'),
} as const
