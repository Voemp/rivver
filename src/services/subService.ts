import { InsertLink, InsertSubscription } from '../db/schema'
import linksRepo from '../repositories/linksRepo'
import subsRepo from '../repositories/subsRepo'

export default {
  subscribe: async (userId: string, url: string, title?: string) => {
    let link = await linksRepo().findByUrl(url)

    if (!link) {
      // TODO: 这里未来可以：fetch RSS → 解析真实 title
      const _link: InsertLink = {
        url,
        title: 'DefaultTitle',
      }
      link = await linksRepo().create(_link)
    }

    const sub: InsertSubscription = {
      userId: userId,
      linkId: link.id,
      title: title ?? null,
    }

    return subsRepo().create(sub)
  },
  unsubscribe: async (userId: string, linkId: number) => {
    await subsRepo().remove(userId, linkId)
  },
  list: async (userId: string) => {
    return subsRepo().listByUser(userId)
  },
}
