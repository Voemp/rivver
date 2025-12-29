import { InsertLink, InsertSubscription } from '../db/schema'
import { createLinkRepo } from '../repositories/link.repo'
import { createSubscriptionRepo } from '../repositories/subscription.repo'
import { AppJWTPayload, DrizzleDB } from '../types/env'

export const createSubService = (db: DrizzleDB, payload: AppJWTPayload) => {
  const linkRepo = createLinkRepo(db)
  const subRepo = createSubscriptionRepo(db)

  return {
    subscribe: async (url: string, title?: string) => {
      let link = await linkRepo.findByUrl(url)

      if (!link) {
        // TODO: 这里未来可以：fetch RSS → 解析真实 title
        const _link: InsertLink = {
          url,
          title: 'DefaultTitle',
        }
        link = await linkRepo.create(_link)
      }

      const sub: InsertSubscription = {
        userId: payload.sub,
        linkId: link.id,
        title: title ?? null,
      }

      return subRepo.create(sub)
    },
    list: async () => {
      return subRepo.listByUser(payload.sub)
    },
  }
}
