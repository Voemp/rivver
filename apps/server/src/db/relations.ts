import { defineRelations } from 'drizzle-orm'
import * as schema from './schema'

export const relations = defineRelations(schema, (r) => ({
  article: {
    feed: r.one.feed({
      from: r.article.feedId,
      to: r.feed.id,
    }),
    usersViaUserBehavior: r.many.user({
      from: r.article.id.through(r.userBehavior.articleId),
      to: r.user.id.through(r.userBehavior.userId),
      alias: 'article_id_user_id_via_userBehavior',
    }),
    usersViaUserFavorite: r.many.user({
      from: r.article.id.through(r.userFavorite.articleId),
      to: r.user.id.through(r.userFavorite.userId),
      alias: 'article_id_user_id_via_userFavorite',
    }),
    usersViaUserRecommendation: r.many.user({
      from: r.article.id.through(r.userRecommendation.articleId),
      to: r.user.id.through(r.userRecommendation.userId),
      alias: 'article_id_user_id_via_userRecommendation',
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
    articlesViaUserBehavior: r.many.article({
      alias: 'article_id_user_id_via_userBehavior',
    }),
    userInterests: r.many.userInterest(),
    articlesViaUserFavorite: r.many.article({
      alias: 'article_id_user_id_via_userFavorite',
    }),
    articlesViaUserRecommendation: r.many.article({
      alias: 'article_id_user_id_via_userRecommendation',
    }),
  },
  userFavorite: {
    user: r.one.user({
      from: r.userFavorite.userId,
      to: r.user.id,
    }),
    article: r.one.article({
      from: r.userFavorite.articleId,
      to: r.article.id,
    }),
  },
  userInterest: {
    user: r.one.user({
      from: r.userInterest.userId,
      to: r.user.id,
    }),
  },
}))