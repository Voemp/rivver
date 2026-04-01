import {
  articleDetailQueryOptions, articleFavoriteQueryOptions, deleteFavorite, deleteSubscription, feedDetailQueryOptions,
  feedSubscriptionQueryOptions, postArticleClick, postArticleShare, postFavorite, postSubscription,
} from '@/api/queries'
import { ArticleActionButtons } from '@/components/article/article-action-buttons'
import { ArticleContentCard, ArticleContentSkeleton } from '@/components/article/article-content-card'
import { ArticleTitleCard, ArticleTitleSkeleton } from '@/components/article/article-title-card'
import { FeedInfoCard } from '@/components/feed/feed-info-card'
import { ErrorState } from '@/components/feedback/error-state'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'
import { useAuth } from '@/hooks/use-auth'
import type { Article, FavoriteStatus, Feed, SubscriptionStatus } from '@/types/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { produce } from 'immer'
import { ArrowLeft } from 'lucide-react-native'
import { useEffect } from 'react'
import { Alert, Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function ArticleScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>()
  const id = Number(rawId)
  const router = useRouter()
  const { ensureAuthed, isAuthed } = useAuth()
  const queryClient = useQueryClient()

  const articleQuery = useQuery(articleDetailQueryOptions(id))
  const article = articleQuery.data as Article | undefined

  const feedQuery = useQuery({
    ...feedDetailQueryOptions(article?.feedId ?? 0),
    enabled: !!article?.feedId,
  })
  const feed = feedQuery.data as Feed | undefined

  const favoriteQuery = useQuery({
    ...articleFavoriteQueryOptions(id),
    enabled: isAuthed,
  })
  const favorite = favoriteQuery.data as FavoriteStatus | undefined

  const subscriptionQuery = useQuery({
    ...feedSubscriptionQueryOptions(article?.feedId ?? 0),
    enabled: isAuthed && !!article?.feedId,
  })
  const subscription = subscriptionQuery.data as SubscriptionStatus | undefined

  useEffect(() => {
    if (id) void postArticleClick(id).catch(() => {
    })
  }, [id])

  const favoriteMutation = useMutation({
    mutationFn: async () => (favorite?.favorited ? deleteFavorite(id) : postFavorite(id)),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['article', id, 'favorite'] })
      const prev = queryClient.getQueryData(['article', id, 'favorite'])
      queryClient.setQueryData(['article', id, 'favorite'], (old: any) => ({
        ...old, favorited: !old?.favorited,
      }))
      return { prev }
    },
    onError: (_err, _v, ctx) => {
      queryClient.setQueryData(['article', id, 'favorite'], ctx?.prev)
      Alert.alert('操作失败', '收藏操作失败')
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: ['article', id, 'favorite'] }),
  })

  const subscriptionMutation = useMutation({
    mutationFn: async (action: 'subscribe' | 'unsubscribe') =>
      action === 'subscribe'
        ? postSubscription({ url: feed!.url, title: feed!.title })
        : deleteSubscription(article!.feedId),
    onMutate: async (action) => {
      const feedId = article!.feedId
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['feed', feedId, 'subscription'] }),
        queryClient.cancelQueries({ queryKey: ['feed', feedId, 'detail'] }),
      ])
      const prevSub = queryClient.getQueryData(['feed', feedId, 'subscription'])
      const prevFeed = queryClient.getQueryData(['feed', feedId, 'detail'])
      queryClient.setQueryData(
        ['feed', feedId, 'subscription'],
        produce((draft: any) => {
          if (draft) draft.subscribed = action === 'subscribe'
        }),
      )
      queryClient.setQueryData(
        ['feed', feedId, 'detail'],
        produce((draft: any) => {
          if (!draft) return
          draft.subscriberCount = Math.max(0, (draft.subscriberCount ?? 0) + (action === 'subscribe' ? 1 : -1))
        }),
      )
      return { prevSub, prevFeed }
    },
    onError: (err, _v, ctx) => {
      const feedId = article!.feedId
      queryClient.setQueryData(['feed', feedId, 'subscription'], ctx?.prevSub)
      queryClient.setQueryData(['feed', feedId, 'detail'], ctx?.prevFeed)
      Alert.alert('操作失败', (err as Error).message || '订阅操作失败')
    },
    onSettled: () => {
      const feedId = article!.feedId
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ['feed', feedId, 'subscription'] }),
        queryClient.invalidateQueries({ queryKey: ['feed', feedId, 'detail'] }),
        queryClient.invalidateQueries({ queryKey: ['subscription', 'list'] }),
      ])
    },
  })

  const shareMutation = useMutation({
    mutationFn: () => postArticleShare(id),
  })

  if (articleQuery.isPending || (article && feedQuery.isPending)) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center gap-3 px-4 py-3">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <ArrowLeft size={22} color="#0a0a0a" />
          </Pressable>
          <Skeleton className="h-5 w-40" />
        </View>
        <View className="px-4">
          <ArticleTitleSkeleton />
          <Separator />
          <ArticleContentSkeleton />
        </View>
      </SafeAreaView>
    )
  }

  if (articleQuery.isError || !article) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center gap-3 px-4 py-3">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <ArrowLeft size={22} color="#0a0a0a" />
          </Pressable>
        </View>
        <ErrorState onRetry={() => void articleQuery.refetch()} />
      </SafeAreaView>
    )
  }

  const content = article.content ?? ''

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 border-b border-border px-4 py-3">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ArrowLeft size={22} color="#0a0a0a" />
        </Pressable>
        <Text className="flex-1 text-base text-foreground" style={{ fontWeight: '600' }} numberOfLines={1}>
          {article.title}
        </Text>
      </View>

      <ScrollView contentContainerClassName="px-4 pb-10">
        <View className="pt-4">
          <ArticleTitleCard
            title={article.title}
            author={article.author}
            pubDate={article.pubDate}
            feed={feed ?? { id: article.feedId, title: '加载中...', image: null }}
          />
        </View>

        <Separator />

        <ArticleContentCard content={content} />

        <Separator className="my-2" />

        {feed && (
          <View className="my-4">
            <FeedInfoCard
              feed={feed}
              subscribed={subscription?.subscribed}
              linkToFeed
              onSubscribe={() => {
                if (!ensureAuthed()) return
                void subscriptionMutation.mutateAsync('subscribe')
              }}
              onUnsubscribe={() => void subscriptionMutation.mutateAsync('unsubscribe')}
            />
          </View>
        )}

        <ArticleActionButtons
          favorited={favorite?.favorited}
          articleUrl={article.link ?? undefined}
          articleTitle={article.title}
          ensureAuthed={ensureAuthed}
          onFavorite={() => {
            if (!ensureAuthed()) return
            void favoriteMutation.mutateAsync()
          }}
          onShare={() => {
            if (!ensureAuthed()) return
            void shareMutation.mutateAsync()
          }}
        />
      </ScrollView>
    </SafeAreaView>
  )
}
