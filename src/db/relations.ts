import { defineRelations } from 'drizzle-orm'
import * as schema from './schema'

export const relations = defineRelations(schema, (r) => ({
  profiles: {
    user: r.one.users({
      from: r.profiles.userId,
      to: r.users.id
    }),
  },
  users: {
    profiles: r.many.profiles(),
    links: r.many.links(),
  },
  links: {
    users: r.many.users({
      from: r.links.id.through(r.subscriptions.linkId),
      to: r.users.id.through(r.subscriptions.userId),
    }),
  },
}))
