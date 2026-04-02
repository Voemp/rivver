import { ArticleModel } from '@server/modules/article/model'
import { betterAuth } from '@server/modules/auth/service'
import { FeedModel } from '@server/modules/feed/model'
import { articleRepo } from '@server/repos/articleRepo'
import { feedRepo } from '@server/repos/feedRepo'
import { subRepo } from '@server/repos/subRepo'
import { Elysia, status } from 'elysia'

export const feed = new Elysia({
  prefix: '/feed',
  detail: {
    tags: ['Feed'],
    security: [{ cookieAuth: [] }],
  },
})
  .use(betterAuth)
  .get('/:id', async ({ params: { id } }) => {
    const feedInfo = await feedRepo.findById(id)
    return status(200, feedInfo)
  }, {
    params: FeedModel.feedParams,
    response: {
      200: FeedModel.feedResponse,
    },
  })
  .get('/:id/articles', async ({ params: { id }, query: { offset = 0, limit = 20, contentType } }) => {
    console.log(contentType)
    const articles = await articleRepo.listByFeedId(id, offset, Math.min(limit, 50), contentType)
    return status(200, articles)
  }, {
    params: FeedModel.feedParams,
    query: ArticleModel.articleListQuery,
    response: {
      200: ArticleModel.articleListResponse,
    },
  })
  .get('/:id/subscription', async ({ user, params: { id } }) => {
    const subscribed = await subRepo.exists(user.id, id)
    return status(200, { subscribed, feedId: id })
  }, {
    auth: true,
    params: FeedModel.feedParams,
    response: {
      200: FeedModel.subscriptionStatusResponse,
    },
  })
