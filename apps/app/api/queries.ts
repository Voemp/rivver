import { appClient, unwrapResponse } from '@/api/client'
import { env } from '@/config/env'
import type { Article, ArticleItem, FavoriteStatus, Feed, Subscription, SubscriptionStatus } from '@/types/api'
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'

const DEFAULT_LIMIT = env.articleListPageSize

export const fetchPopularList = (offset: number, limit = DEFAULT_LIMIT) =>
  unwrapResponse(appClient.article.popular.get({ query: { offset, limit } }), '加载热门文章失败')

export const fetchRecommendationList = (offset: number, limit = DEFAULT_LIMIT) =>
  unwrapResponse(appClient.article.recommendation.get({ query: { offset, limit } }), '加载推荐文章失败')

export const articlesInfiniteOptions = (isAuthed: boolean, pageSize: number) =>
  infiniteQueryOptions({
    queryKey: ['article', isAuthed ? 'recommendation' : 'popular', 'infinite', pageSize] as const,
    queryFn: ({ pageParam }) =>
      isAuthed ? fetchRecommendationList(pageParam, pageSize) : fetchPopularList(pageParam, pageSize),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) =>
      lastPage.length < pageSize ? undefined : pages.length * pageSize,
    staleTime: Infinity,
  })

export const favoritesQueryOptions = (offset = 0, limit = 50) =>
  queryOptions({
    queryKey: ['article', 'favorites', offset, limit] as const,
    queryFn: () => unwrapResponse(
      appClient.article.favorites.get({ query: { offset, limit } }),
      '加载收藏失败',
    ) as Promise<ArticleItem[]>,
  })

export const articleDetailQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ['article', id, 'detail'] as const,
    queryFn: () => unwrapResponse(appClient.article({ id }).get(), '加载文章详情失败') as Promise<Article>,
    staleTime: 1000 * 60 * 10,
  })

export const feedDetailQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ['feed', id, 'detail'] as const,
    queryFn: () => unwrapResponse(appClient.feed({ id }).get(), '加载订阅源详情失败') as Promise<Feed>,
    staleTime: 1000 * 60 * 10,
  })

export const articleFavoriteQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ['article', id, 'favorite'] as const,
    queryFn: () => unwrapResponse(
      appClient.article({ id }).favorite.get(),
      '加载收藏状态失败',
    ) as Promise<FavoriteStatus>,
    staleTime: 1000 * 60 * 10,
  })

export const feedSubscriptionQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ['feed', id, 'subscription'] as const,
    queryFn: () => unwrapResponse(
      appClient.feed({ id }).subscription.get(),
      '加载订阅状态失败',
    ) as Promise<SubscriptionStatus>,
    staleTime: 1000 * 60 * 10,
  })

export const feedArticlesQueryOptions = (id: number, offset = 0, limit = DEFAULT_LIMIT) =>
  queryOptions({
    queryKey: ['feed', id, 'articles', offset, limit] as const,
    queryFn: () => unwrapResponse(
      appClient.feed({ id }).articles.get({ query: { offset, limit } }),
      '加载订阅源文章失败',
    ) as Promise<ArticleItem[]>,
  })

export const subscriptionListQueryOptions = () =>
  queryOptions({
    queryKey: ['subscription', 'list'] as const,
    queryFn: () => unwrapResponse(
      appClient.subscription.get(),
      '加载订阅列表失败',
    ) as unknown as Promise<Subscription[]>,
  })

export const postFavorite = async (id: number) =>
  unwrapResponse(appClient.article({ id }).favorite.post(), '收藏失败')

export const deleteFavorite = async (id: number) =>
  unwrapResponse(appClient.article({ id }).favorite.delete(), '取消收藏失败')

export const postArticleShare = async (id: number) =>
  unwrapResponse(appClient.article({ id }).share.post(), '分享记录失败')

export const postArticleClick = async (id: number) =>
  unwrapResponse(appClient.article({ id }).click.post(), '点击记录失败')

export const postReadProgress = async (id: number, progress: number) =>
  unwrapResponse(appClient.article({ id })['read-progress'].post({ progress }), '阅读进度记录失败')

export const postSubscription = async (payload: { url: string; title?: string | null }) =>
  unwrapResponse(appClient.subscription.post({ ...payload }), '订阅失败')

export const deleteSubscription = async (feedId: number) =>
  unwrapResponse(appClient.subscription.delete({ feedId }), '取消订阅失败')
