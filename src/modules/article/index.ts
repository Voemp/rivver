import { articleRepo } from '@server/repos/articleRepo'
import { behaviorRepo } from '@server/repos/behaviorRepo'
import { favoriteRepo } from '@server/repos/favoriteRepo'
import { interestRepo } from '@server/repos/interestRepo'
import { recommendRepo } from '@server/repos/recommendRepo'
import { AppError } from '@server/utils/error'
import { Elysia, status } from 'elysia'
import { AuthService } from '../auth/service'
import { ArticleModel } from './model'
import { assertProgress, BEHAVIOR_SCORE, calcReadScore } from './service'

export const article = new Elysia({
  prefix: '/article',
  detail: {
    tags: ['Article'],
    security: [{ bearerAuth: [] }],
  },
})
  .use(AuthService)
  .get('/:id', async ({ params: { id } }) => {
    const detail = await articleRepo.findById(id)
    return status(200, detail)
  }, {
    params: ArticleModel.articleParams,
    response: {
      200: ArticleModel.articleResponse,
    },
  })
  .get('/recommendation', async ({ user, query: { offset = 0, limit = 20 } }) => {
    limit = Math.min(limit, 50)

    const interest = await interestRepo.findByUser(user.id)

    if (!interest?.interestVector) {
      const articles = await articleRepo.listPopular(offset, limit)
      return status(200, articles)
    }

    if (offset === 0) {
      const candidateIds = await articleRepo.listByUserInterest(interest.interestVector)
      await Promise.all(candidateIds.map((id, index) => recommendRepo.create({
        userId: user.id,
        articleId: id,
        rank: index,
      })))
    }

    const articleIds = await recommendRepo.listByUser(user.id, offset, limit)
    const articles = await articleRepo.listByIds(articleIds)
    return status(200, articles)
  }, {
    isAuth: true,
    query: ArticleModel.articleListQuery,
    response: {
      200: ArticleModel.articleListResponse,
    },
  })
  .get('/favorites', async ({ user, query: { offset = 0, limit = 20 } }) => {
    const list = await favoriteRepo.listByUser(user.id, offset, Math.min(limit, 50))
    return status(200, list)
  }, {
    isAuth: true,
    query: ArticleModel.articleListQuery,
    response: {
      200: ArticleModel.articleListResponse,
    },
  })
  .post('/:id/favorite', async ({ user, params: { id } }) => {
    const target = await articleRepo.findById(id)
    if (!target) throw new AppError(404, '文章不存在', 'ARTICLE_NOT_FOUND')

    const existed = await favoriteRepo.exists(user.id, id)
    if (existed) return status(200, { favorited: true, articleId: id })

    await favoriteRepo.createWithBehavior(
      {
        userId: user.id,
        articleId: id,
      },
      {
        userId: user.id,
        articleId: id,
        type: 'favorite',
        score: BEHAVIOR_SCORE.favorite,
      },
    )

    return status(200, { favorited: true, articleId: id })
  }, {
    isAuth: true,
    params: ArticleModel.articleParams,
    response: {
      200: ArticleModel.favoriteStatusResponse,
    },
  })
  .delete('/:id/favorite', async ({ user, params: { id } }) => {
    await favoriteRepo.remove(user.id, id)
    return status(200, { favorited: false, articleId: id })
  }, {
    isAuth: true,
    params: ArticleModel.articleParams,
    response: {
      200: ArticleModel.favoriteStatusResponse,
    },
  })
  .get('/:id/favorite', async ({ user, params: { id } }) => {
    const favorited = await favoriteRepo.exists(user.id, id)
    return status(200, { favorited, articleId: id })
  }, {
    isAuth: true,
    params: ArticleModel.articleParams,
    response: {
      200: ArticleModel.favoriteStatusResponse,
    },
  })
  .post('/:id/click', async ({ user, params: { id } }) => {
    const target = await articleRepo.findById(id)
    if (!target) throw new AppError(404, '文章不存在', 'ARTICLE_NOT_FOUND')

    const existed = await behaviorRepo.existsByUserArticleType(user.id, id, 'click')
    if (existed) return status(200, { recorded: false, type: 'click', articleId: id })

    await behaviorRepo.create({
      userId: user.id,
      articleId: id,
      type: 'click',
      score: BEHAVIOR_SCORE.click,
    })

    return status(200, { recorded: true, type: 'click', articleId: id })
  }, {
    isAuth: true,
    params: ArticleModel.articleParams,
    response: {
      200: ArticleModel.behaviorResponse,
    },
  })
  .post('/:id/read-progress', async ({ user, params: { id }, body }) => {
    const target = await articleRepo.findById(id)
    if (!target) throw new AppError(404, '文章不存在', 'ARTICLE_NOT_FOUND')

    assertProgress(body.progress)

    const maxProgress = await behaviorRepo.findMaxReadProgress(user.id, id)
    if (body.progress <= maxProgress) {
      return status(200, { recorded: false, articleId: id, progress: maxProgress })
    }

    await behaviorRepo.create({
      userId: user.id,
      articleId: id,
      type: 'read',
      score: calcReadScore(body.progress),
      readProgress: body.progress,
    })

    return status(200, { recorded: true, articleId: id, progress: body.progress })
  }, {
    isAuth: true,
    params: ArticleModel.articleParams,
    body: ArticleModel.readProgressBody,
    response: {
      200: ArticleModel.readProgressResponse,
    },
  })
  .post('/:id/share', async ({ user, params: { id } }) => {
    const target = await articleRepo.findById(id)
    if (!target) throw new AppError(404, '文章不存在', 'ARTICLE_NOT_FOUND')

    const existed = await behaviorRepo.existsByUserArticleType(user.id, id, 'share')
    if (existed) return status(200, { recorded: false, type: 'share', articleId: id })

    await behaviorRepo.create({
      userId: user.id,
      articleId: id,
      type: 'share',
      score: BEHAVIOR_SCORE.share,
    })

    return status(200, { recorded: true, type: 'share', articleId: id })
  }, {
    isAuth: true,
    params: ArticleModel.articleParams,
    response: {
      200: ArticleModel.behaviorResponse,
    },
  })
