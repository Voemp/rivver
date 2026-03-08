import { articleRepo } from '@server/repos/articleRepo'
import { behaviorRepo } from '@server/repos/behaviorRepo'
import { favoriteRepo } from '@server/repos/favoriteRepo'
import { recommendRepo } from '@server/repos/recommendRepo'
import { AppError } from '@server/utils/error'
import { Elysia, status } from 'elysia'
import { betterAuth } from '../auth/service'
import { ArticleModel } from './model'
import { assertProgress, BEHAVIOR_SCORE, calcReadScore, refreshUserInterest, seedUserRecommendations } from './service'

export const article = new Elysia({
  prefix: '/article',
  detail: {
    tags: ['Article'],
    security: [{ cookieAuth: [] }],
  },
})
  .use(betterAuth)
  .get('/:id', async ({ params: { id } }) => {
    const detail = await articleRepo.findById(id)
    return status(200, detail)
  }, {
    params: ArticleModel.articleParams,
    response: {
      200: ArticleModel.articleResponse,
    },
    detail: {
      security: [],
    },
  })
  .get('/popular', async ({ query: { offset = 0, limit = 20 } }) => {
    const articles = await articleRepo.listPopular(offset, Math.min(limit, 50))
    return status(200, articles)
  }, {
    query: ArticleModel.articleListQuery,
    response: {
      200: ArticleModel.articleListResponse,
    },
  })
  .get('/recommendation', async ({ user, query: { offset = 0, limit = 20 } }) => {
    limit = Math.min(limit, 50)

    if (offset === 0) {
      const seededIds = await seedUserRecommendations(user.id)
      if (seededIds.length === 0) {
        const articles = await articleRepo.listPopular(offset, limit)
        return status(200, articles)
      }
    }

    const articleIds = await recommendRepo.listByUser(user.id, offset, limit)

    if (articleIds.length === 0) {
      const articles = await articleRepo.listPopular(offset, limit)
      return status(200, articles)
    }

    const articles = await articleRepo.listByIds(articleIds)
    const ordered = articleIds.reduce<typeof articles>((result, id) => {
      const found = articles.find(article => article.id === id)
      if (found) result.push(found)
      return result
    }, [])

    return status(200, ordered)
  }, {
    auth: true,
    query: ArticleModel.articleListQuery,
    response: {
      200: ArticleModel.articleListResponse,
    },
  })
  .get('/favorites', async ({ user, query: { offset = 0, limit = 20 } }) => {
    const articles = await favoriteRepo.listByUser(user.id, offset, Math.min(limit, 50))
    return status(200, articles)
  }, {
    auth: true,
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

    void refreshUserInterest(user.id)

    return status(200, { favorited: true, articleId: id })
  }, {
    auth: true,
    params: ArticleModel.articleParams,
    response: {
      200: ArticleModel.favoriteStatusResponse,
    },
  })
  .delete('/:id/favorite', async ({ user, params: { id } }) => {
    await favoriteRepo.removeWithBehavior(user.id, id)
    void refreshUserInterest(user.id)
    return status(200, { favorited: false, articleId: id })
  }, {
    auth: true,
    params: ArticleModel.articleParams,
    response: {
      200: ArticleModel.favoriteStatusResponse,
    },
  })
  .get('/:id/favorite', async ({ user, params: { id } }) => {
    const favorited = await favoriteRepo.exists(user.id, id)
    return status(200, { favorited, articleId: id })
  }, {
    auth: true,
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

    void refreshUserInterest(user.id)

    return status(200, { recorded: true, type: 'click', articleId: id })
  }, {
    auth: true,
    params: ArticleModel.articleParams,
    response: {
      200: ArticleModel.behaviorResponse,
    },
  })
  .post('/:id/read-progress', async ({ user, params: { id }, body }) => {
    const target = await articleRepo.findById(id)
    if (!target) throw new AppError(404, '文章不存在', 'ARTICLE_NOT_FOUND')

    assertProgress(body.progress)

    const existed = await behaviorRepo.existsByUserArticleType(user.id, id, 'read')
    if (!existed) {
      await behaviorRepo.create({
        userId: user.id,
        articleId: id,
        type: 'read',
        score: calcReadScore(body.progress),
        readProgress: body.progress,
      })
      void refreshUserInterest(user.id)
      return status(200, { recorded: true, articleId: id, progress: body.progress })
    }

    const maxProgress = await behaviorRepo.findMaxReadProgress(user.id, id)
    if (body.progress <= maxProgress) {
      return status(200, { recorded: false, articleId: id, progress: maxProgress })
    } else {
      await behaviorRepo.updateReadProgress(
        user.id,
        id,
        {
          readProgress: body.progress,
          score: calcReadScore(body.progress),
        },
      )
      void refreshUserInterest(user.id)
      return status(200, { recorded: true, articleId: id, progress: body.progress })
    }
  }, {
    auth: true,
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

    void refreshUserInterest(user.id)

    return status(200, { recorded: true, type: 'share', articleId: id })
  }, {
    auth: true,
    params: ArticleModel.articleParams,
    response: {
      200: ArticleModel.behaviorResponse,
    },
  })
