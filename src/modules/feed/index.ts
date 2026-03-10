import { FeedModel } from '@server/modules/feed/model'
import { feedRepo } from '@server/repos/feedRepo'
import { Elysia, status } from 'elysia'

export const feed = new Elysia({
  prefix: '/feed',
  detail: {
    tags: ['Feed'],
    security: [{ cookieAuth: [] }],
  },
})
  .get('/:id', async ({ params: { id } }) => {
    const feedInfo = await feedRepo.findById(id)
    return status(200, feedInfo)
  }, {
    params: FeedModel.feedParams,
    response: {
      200: FeedModel.feedResponse,
    },
  })