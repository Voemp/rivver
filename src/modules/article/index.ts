import { articleRepo } from '@server/repos/articleRepo'
import { interestRepo } from '@server/repos/interestRepo'
import { recommendRepo } from '@server/repos/recommendRepo'
import { Elysia, status } from 'elysia'
import { AuthService } from '../auth/service'
import { ArticleModel } from './model'

export const article = new Elysia({
  prefix: '/article',
  detail: {
    tags: ['Article'],
    security: [{ bearerAuth: [] }],
  },
})
  .use(AuthService)
  .get('/recommendation', async ({ user, query: { offest = 0, limit = 20 } }) => {
    limit = Math.min(limit, 50)

    // 1. 获取用户兴趣向量（缓存）
    const interest = await interestRepo.findByUser(user.id)

    // 2. 冷启动处理：无兴趣向量时用热门文章
    if (!interest?.interestVector) {
      const articles = await articleRepo.listPopular(offest, limit)
      return status(200, articles)
    }

    // 3. 首次刷新：计算推荐池
    if (offest === 0) {
      const candidateIds = await articleRepo.listByUserInterest(interest.interestVector)
      candidateIds.forEach((id, index) => {
        recommendRepo.create({ userId: user.id, articleId: id, rank: index })
      })
    }

    // 4. 分页获取推荐文章
    const articleIds = await recommendRepo.listByUser(user.id, offest, limit)
    const articles = await articleRepo.listByIds(articleIds)
    return status(200, articles)
  }, {
    isAuth: true,
    query: ArticleModel.recommendQuery,
    response: {
      200: ArticleModel.recommendResponse,
    },
  })
  .get('/:id', async ({ params: { id } }) => {
    const article = await articleRepo.findById(id)
    return status(200, article)
  }, {
    params: ArticleModel.articleParams,
    response: {
      200: ArticleModel.articleResponse,
    },
  })