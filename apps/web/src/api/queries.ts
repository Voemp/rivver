import { appClient, unwrapResponse } from '@/api/client'
import { env } from '@/config/env'
import type { ContentType } from '@/types/content'
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'

const DEFAULT_LIMIT = env.articleListPageSize

export const fetchPopularList = async (offset: number, limit = DEFAULT_LIMIT, contentType?: ContentType) =>
  unwrapResponse(
    appClient.article.popular.get({ query: { offset, limit, contentType } }),
    'Failed to load popular articles',
  )

export const fetchRecommendationList = async (offset: number, limit = DEFAULT_LIMIT, contentType?: ContentType) =>
  unwrapResponse(
    appClient.article.recommendation.get({ query: { offset, limit, contentType } }),
    'Failed to load recommendations',
  )

export const articlesInfiniteOptions = (isAuthed: boolean, pageSize: number, contentType?: ContentType) =>
  infiniteQueryOptions({
    queryKey: ['article', isAuthed ? 'recommendation' : 'popular', 'infinite', pageSize, contentType ?? 'all'] as const,
    queryFn: ({ pageParam }) => isAuthed
      ? fetchRecommendationList(pageParam, pageSize, contentType)
      : fetchPopularList(pageParam, pageSize, contentType),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      return lastPage.length < pageSize ? undefined : pages.length * pageSize
    },
    staleTime: Infinity,
  })

export const favoritesQueryOptions = (offset = 0, limit = 50) =>
  queryOptions({
    queryKey: ['article', 'favorites', offset, limit] as const,
    queryFn: () => unwrapResponse(
      appClient.article.favorites.get({ query: { offset, limit } }),
      'Failed to load favorites',
    ),
  })

export const articleDetailQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ['article', id, 'detail'] as const,
    queryFn: () => unwrapResponse(appClient.article({ id }).get(), 'Failed to load article details'),
    staleTime: 1000 * 60 * 10,
  })

export const searchArticles = async (q: string, offset = 0, limit = 24, contentType?: ContentType) =>
  unwrapResponse(
    appClient.article.search.get({ query: { q, offset, limit, contentType } }),
    'Failed to search articles',
  )

export const articleSearchQueryOptions = (q: string, offset = 0, limit = 24, contentType?: ContentType) =>
  queryOptions({
    queryKey: ['article', 'search', q, offset, limit, contentType ?? 'all'] as const,
    queryFn: () => searchArticles(q, offset, limit, contentType),
    staleTime: 1000 * 30,
  })

export const postArticleAiSummary = async (id: number) =>
  unwrapResponse(appClient.article({ id })['ai-summary'].post(), 'Failed to generate AI summary')

export const feedDetailQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ['feed', id, 'detail'] as const,
    queryFn: () => unwrapResponse(appClient.feed({ id }).get(), 'Failed to load feed details'),
    staleTime: 1000 * 60 * 10,
  })

export const feedPopularQueryOptions = (limit = 6, contentType?: ContentType) =>
  queryOptions({
    queryKey: ['feed', 'popular', limit, contentType ?? 'all'] as const,
    queryFn: () => unwrapResponse(
      appClient.feed.popular.get({ query: { limit, contentType } }),
      'Failed to load popular feeds',
    ),
    staleTime: 1000 * 60 * 10,
  })

export const articleFavoriteQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ['article', id, 'favorite'] as const,
    queryFn: () => unwrapResponse(appClient.article({ id }).favorite.get(), 'Failed to load favorite status'),
    staleTime: 1000 * 60 * 10,
  })

export const feedSubscriptionQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ['feed', id, 'subscription'] as const,
    queryFn: () => unwrapResponse(appClient.feed({ id }).subscription.get(), 'Failed to load subscription status'),
    staleTime: 1000 * 60 * 10,
  })

export const feedArticlesQueryOptions = (id: number, offset = 0, limit = DEFAULT_LIMIT, contentType?: ContentType) =>
  queryOptions({
    queryKey: ['feed', id, 'articles', offset, limit, contentType ?? 'all'] as const,
    queryFn: () => unwrapResponse(
      appClient.feed({ id }).articles.get({ query: { offset, limit, contentType } }),
      'Failed to load feed articles',
    ),
  })

export const subscriptionListQueryOptions = () =>
  queryOptions({
    queryKey: ['subscription', 'list'] as const,
    queryFn: () => unwrapResponse(appClient.subscription.get(), 'Failed to load subscriptions'),
  })

export const postFavorite = async (id: number) =>
  unwrapResponse(appClient.article({ id }).favorite.post(), 'Failed to favorite article')

export const deleteFavorite = async (id: number) =>
  unwrapResponse(appClient.article({ id }).favorite.delete(), 'Failed to unfavorite article')

export const postArticleShare = async (id: number) =>
  unwrapResponse(appClient.article({ id }).share.post(), 'Failed to record share event')

export const postArticleClick = async (id: number) =>
  unwrapResponse(appClient.article({ id }).click.post(), 'Failed to record click event')

export const postReadProgress = async (id: number, progress: number) =>
  unwrapResponse(appClient.article({ id })['read-progress'].post({ progress }), 'Failed to record reading progress')

export const postSubscription = async (payload: { url: string; title?: string | null }) =>
  unwrapResponse(appClient.subscription.post({ ...payload }), 'Failed to subscribe')

export const deleteSubscription = async (feedId: number) =>
  unwrapResponse(appClient.subscription.delete({ feedId }), 'Failed to unsubscribe')

export const putAvatar = async (file: File) =>
  unwrapResponse(appClient.profile.avatar.put({ file }), 'Failed to update avatar')
