import { t } from 'elysia'
import { table } from './schema'
import { createModel } from './utils'

export const DBModel = createModel(table, {
  feed: {
    url: t.String({ format: 'uri' }),
    link: t.String({ format: 'uri' }),
  },
})
