import { articleRepo } from '../../repositories/articleRepo'
import { interestRepo } from '../../repositories/interestRepo'
import { recommendRepo } from '../../repositories/recommendRepo'
import { ArticleModel } from './model'

export abstract class ArticleService {
  static async recommend(userId: string, { offest = 0, limit = 20 }: ArticleModel.RecommendQuery) {
    limit = Math.min(limit, 50)

    // 1. 获取用户兴趣向量（缓存）
    const interest = await interestRepo.findByUser(userId)

    // 2. 冷启动处理：无兴趣向量时用热门文章
    if (!interest?.interestVector) {
      console.log('无兴趣向量，使用热门文章')
      return articleRepo.listPopular(offest, limit)
    }

    // 3. 首次刷新：计算推荐池
    if (offest === 0) {
      const candidateIds = await articleRepo.listByUserInterest(interest.interestVector)
      candidateIds.forEach((id, index) => {
        recommendRepo.create(userId, id, index)
      })
    }

    // 4. 分页获取推荐文章
    const articleIds = await recommendRepo.listByUser(userId, offest, limit)
    return articleRepo.listByIds(articleIds)
  }
}