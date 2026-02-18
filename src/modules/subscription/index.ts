import { InsertFeed, InsertSubscription } from '@/db/schema'
import { feedRepo } from '@/repos/feedRepo'
import { subRepo } from '@/repos/subRepo'
import { ApiResponseModel, res } from '@/types/response'
import { AppError } from '@/utils/error'
import { fetchSingleFeed } from '@/worker/rss/fetcher'
import { Elysia } from 'elysia'
import Parser from 'rss-parser'
import { AuthService } from '../auth/service'
import { SubModel } from './model'

export const subscription = new Elysia({
  prefix: '/subscription',
  detail: {
    tags: ['Subscription'],
    security: [{ bearerAuth: [] }],
  },
})
  .use(AuthService)
  .get('/', async ({ user }) => {
    const subs = await subRepo.listByUser(user.id)
    return res.success(subs, 200)
  }, {
    isAuth: true,
    response: {
      200: ApiResponseModel.success(SubModel.listResponse),
    },
  })
  .post('/', async ({ user, body: { url, title } }) => {
    let feed = await feedRepo.findByUrl(url)
    if (!feed) {
      const parser = new Parser()
      const feedInfo = await parser.parseURL(url)
      const _feed: InsertFeed = {
        url,
        title: feedInfo.title || 'DefaultTitle',
        description: feedInfo.description,
        link: feedInfo.link,
        image: feedInfo.image?.url,
      }
      feed = await feedRepo.create(_feed)
      // 新增订阅时，立即异步 fetch 数据
      queueMicrotask(() => {
        if (!feed) return
        fetchSingleFeed(feed)
      })
    }

    const existing = await subRepo.findByUserAndLink(user.id, feed.id)
    if (existing) throw new AppError('订阅已存在', 'SUBSCRIPTION_EXISTS', 409)

    const _sub: InsertSubscription = {
      userId: user.id,
      feedId: feed.id,
      title: title || feed.title,
    }

    const sub = await subRepo.create(_sub)
    return res.success(sub, 201)
  }, {
    isAuth: true,
    body: SubModel.subBody,
    response: {
      201: ApiResponseModel.success(SubModel.subResponse),
    },
  })
  .delete('/', async ({ user, body: { feedId } }) => {
    const existing = await subRepo.findByUserAndLink(user.id, feedId)
    if (!existing) throw new AppError('订阅不存在', 'SUBSCRIPTION_NOT_FOUND', 404)

    const sub = await subRepo.remove(user.id, feedId)
    return res.success(sub, 200)
  }, {
    isAuth: true,
    body: SubModel.unsubBody,
    response: {
      200: ApiResponseModel.success(SubModel.unsubResponse),
    },
  })
