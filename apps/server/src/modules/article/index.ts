import { articleRepo } from '@server/repos/articleRepo'
import { behaviorRepo } from '@server/repos/behaviorRepo'
import { favoriteRepo } from '@server/repos/favoriteRepo'
import { recommendRepo } from '@server/repos/recommendRepo'
import { AppError } from '@server/utils/error'
import { Elysia, status } from 'elysia'

import { betterAuth } from '../auth/service'
import { ensureArticleAiSummary } from './ai-summary'
import { ArticleModel } from './model'
import {
  assertProgress,
  BEHAVIOR_SCORE,
  calcReadScore,
  listFallbackForRecommendation,
  listPopularArticles,
  refreshUserInterest,
  seedUserRecommendations,
} from './service'

async function refreshRecommendations(userId: string) {
  try {
    await refreshUserInterest(userId)
    return await seedUserRecommendations(userId)
  } catch {
    return null
  }
}

export const article = new Elysia({
  prefix: '/article',
  detail: {
    tags: ['Article'],
    security: [{ cookieAuth: [] }],
  },
})
  .use(betterAuth)
  .get(
    '/search',
    {
      query: ArticleModel.articleSearchQuery,
      response: {
        200: ArticleModel.articleSearchResponse,
      },
      detail: {
        security: [],
      },
    },
    async ({ query: { q, offset = 0, limit = 24, contentType } }) => {
      const articles = await articleRepo.search(q, offset, Math.min(limit, 50), contentType)
      return status(200, articles)
    },
  )
  .get(
    '/:id',
    {
      params: ArticleModel.articleParams,
      response: {
        200: ArticleModel.articleResponse,
      },
      detail: {
        security: [],
      },
    },
    async ({ params: { id } }) => {
      const detail = await articleRepo.findById(id)
      if (!detail) throw new AppError(404, '文章不存在', 'ARTICLE_NOT_FOUND')
      return status(200, detail)
    },
  )
  .post(
    '/:id/ai-summary',
    {
      params: ArticleModel.articleParams,
      response: {
        200: ArticleModel.aiSummaryResponse,
      },
      detail: {
        security: [],
      },
    },
    async ({ params: { id } }) => {
      const aiSummary = await ensureArticleAiSummary(id)
      return status(200, { articleId: id, aiSummary })
    },
  )
  .get(
    '/popular',
    {
      query: ArticleModel.articleListQuery,
      response: {
        200: ArticleModel.articleListResponse,
      },
    },
    async ({ query: { offset = 0, limit = 20, contentType } }) => {
      const articles = await listPopularArticles(offset, Math.min(limit, 50), contentType)
      return status(200, articles)
    },
  )
  .get(
    '/recommendation',
    {
      auth: true,
      query: ArticleModel.articleListQuery,
      response: {
        200: ArticleModel.articleListResponse,
      },
    },
    async ({ user, query: { offset = 0, limit = 20, contentType } }) => {
      limit = Math.min(limit, 50)

      if (offset === 0) {
        const seededIds = await seedUserRecommendations(user.id, contentType)
        if (seededIds.length === 0) {
          const articles = await listPopularArticles(offset, limit, contentType)
          return status(200, articles)
        }
      }

      const articleIds = await recommendRepo.listByUser(user.id, offset, limit)

      if (articleIds.length === 0) {
        const articles = await listPopularArticles(offset, limit, contentType)
        return status(200, articles)
      }

      const articles = await articleRepo.listByIds(articleIds, contentType)
      const ordered = articleIds.reduce<typeof articles>((result, id) => {
        const found = articles.find((article) => article.id === id)
        if (found) result.push(found)
        return result
      }, [])

      if (ordered.length < limit) {
        const fallbackIds = await listFallbackForRecommendation(
          [...articleIds, ...ordered.map((article) => article.id)],
          limit - ordered.length,
          contentType,
        )

        if (fallbackIds.length > 0) {
          const fallbackArticles = await articleRepo.listByIds(fallbackIds, contentType)
          const fallbackOrdered = fallbackIds
            .map((id) => fallbackArticles.find((article) => article.id === id))
            .filter((article): article is NonNullable<typeof article> => Boolean(article))
          return status(200, [...ordered, ...fallbackOrdered])
        }
      }

      return status(200, ordered)
    },
  )
  .get(
    '/favorites',
    {
      auth: true,
      query: ArticleModel.articleListQuery,
      response: {
        200: ArticleModel.articleListResponse,
      },
    },
    async ({ user, query: { offset = 0, limit = 20 } }) => {
      const articles = await favoriteRepo.listByUser(user.id, offset, Math.min(limit, 50))
      return status(200, articles)
    },
  )
  .post(
    '/:id/favorite',
    {
      auth: true,
      params: ArticleModel.articleParams,
      response: {
        200: ArticleModel.favoriteStatusResponse,
      },
    },
    async ({ user, params: { id } }) => {
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

      void refreshRecommendations(user.id)

      return status(200, { favorited: true, articleId: id })
    },
  )
  .delete(
    '/:id/favorite',
    {
      auth: true,
      params: ArticleModel.articleParams,
      response: {
        200: ArticleModel.favoriteStatusResponse,
      },
    },
    async ({ user, params: { id } }) => {
      await favoriteRepo.removeWithBehavior(user.id, id)
      void refreshRecommendations(user.id)
      return status(200, { favorited: false, articleId: id })
    },
  )
  .get(
    '/:id/favorite',
    {
      auth: true,
      params: ArticleModel.articleParams,
      response: {
        200: ArticleModel.favoriteStatusResponse,
      },
    },
    async ({ user, params: { id } }) => {
      const favorited = await favoriteRepo.exists(user.id, id)
      return status(200, { favorited, articleId: id })
    },
  )
  .post(
    '/:id/click',
    {
      auth: true,
      params: ArticleModel.articleParams,
      response: {
        200: ArticleModel.behaviorResponse,
      },
    },
    async ({ user, params: { id } }) => {
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

      void refreshRecommendations(user.id)

      return status(200, { recorded: true, type: 'click', articleId: id })
    },
  )
  .post(
    '/:id/read-progress',
    {
      auth: true,
      params: ArticleModel.articleParams,
      body: ArticleModel.readProgressBody,
      response: {
        200: ArticleModel.readProgressResponse,
      },
    },
    async ({ user, params: { id }, body }) => {
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
        void refreshRecommendations(user.id)
        return status(200, { recorded: true, articleId: id, progress: body.progress })
      }

      const maxProgress = await behaviorRepo.findMaxReadProgress(user.id, id)
      if (body.progress <= maxProgress) {
        return status(200, { recorded: false, articleId: id, progress: maxProgress })
      } else {
        await behaviorRepo.updateReadProgress(user.id, id, {
          readProgress: body.progress,
          score: calcReadScore(body.progress),
        })
        void refreshRecommendations(user.id)
        return status(200, { recorded: true, articleId: id, progress: body.progress })
      }
    },
  )
  .post(
    '/:id/share',
    {
      auth: true,
      params: ArticleModel.articleParams,
      response: {
        200: ArticleModel.behaviorResponse,
      },
    },
    async ({ user, params: { id } }) => {
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

      void refreshRecommendations(user.id)

      return status(200, { recorded: true, type: 'share', articleId: id })
    },
  )
