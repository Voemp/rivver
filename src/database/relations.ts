import { defineRelations } from 'drizzle-orm'
import * as schema from './schema'

export const relations = defineRelations(schema, (r) => ({
  article: {
    feed: r.one.feed({
      from: r.article.feedId,
      to: r.feed.id,
    }),
  },
  feed: {
    articles: r.many.article(),
    users: r.many.user({
      from: r.feed.id.through(r.subscription.feedId),
      to: r.user.id.through(r.subscription.userId),
    }),
  },
  profile: {
    user: r.one.user({
      from: r.profile.userId,
      to: r.user.id,
    }),
  },
  user: {
    profiles: r.many.profile(),
    feeds: r.many.feed(),
  },
}))
