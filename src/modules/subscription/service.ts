import Parser from 'rss-parser'
import { InsertFeed, InsertSubscription } from '../../database/schema'
import { feedRepo } from '../../repositories/feedRepo'
import { subRepo } from '../../repositories/subRepo'
import { AppError } from '../../utils/error'
import { SubModel } from './model'

export abstract class SubService {
  static async subscribe({ url, title }: SubModel.SubBody, userId: string) {
    let feed = await feedRepo.findByUrl(url)
    if (!feed) {
      const parser = new Parser()
      const feedInfo = await parser.parseURL(url)
      const _feed: InsertFeed = {
        url,
        title: feedInfo.title || 'DefaultTitle',
      }
      feed = await feedRepo.create(_feed)
    }

    const existing = await subRepo.findByUserAndLink(userId, feed.id)
    if (existing) throw new AppError(409, '订阅已存在', 'SUBSCRIPTION_EXISTS')

    const sub: InsertSubscription = {
      userId: userId,
      feedId: feed.id,
      title: title || feed.title,
    }

    return subRepo.create(sub)
  }

  static async unsubscribe({ feedId }: SubModel.UnsubBody, userId: string) {
    const sub = await subRepo.remove(userId, feedId)
    if (!sub) throw new AppError(404, '订阅不存在', 'SUBSCRIPTION_NOT_FOUND')
    return sub
  }

  static async list(userId: string) {
    return subRepo.listByUser(userId)
  }
}
