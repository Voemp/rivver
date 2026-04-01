import {
  deleteSubscription, feedArticlesQueryOptions, feedDetailQueryOptions, feedSubscriptionQueryOptions, postSubscription,
} from '@/api/queries'
import { VerticalCard } from '@/components/common/article-card'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'
import { useAuth } from '@/hooks/use-auth'
import type { ArticleItem, Feed, SubscriptionStatus } from '@/types/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { produce } from 'immer'
import { ArrowLeft, ExternalLink } from 'lucide-react-native'
import { Alert, FlatList, Linking, Pressable, RefreshControl, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function FeedScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>()
  const id = Number(rawId)
  const router = useRouter()
  const { ensureAuthed, isAuthed } = useAuth()
  const queryClient = useQueryClient()

  const feedQuery = useQuery(feedDetailQueryOptions(id))
  const feed = feedQuery.data as Feed | undefined

  const subscriptionQuery = useQuery({
    ...feedSubscriptionQueryOptions(id),
    enabled: isAuthed,
  })
  const subscription = subscriptionQuery.data as SubscriptionStatus | undefined

  const articlesQuery = useQuery(feedArticlesQueryOptions(id, 0, 50))
  const articles = (articlesQuery.data ?? []) as ArticleItem[]

  const subscriptionMutation = useMutation({
    mutationFn: async (action: 'subscribe' | 'unsubscribe') =>
      action === 'subscribe'
        ? postSubscription({ url: feed!.url, title: feed!.title })
        : deleteSubscription(id),
    onMutate: async (action) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['feed', id, 'subscription'] }),
        queryClient.cancelQueries({ queryKey: ['feed', id, 'detail'] }),
      ])
      const prevSub = queryClient.getQueryData(['feed', id, 'subscription'])
      const prevFeed = queryClient.getQueryData(['feed', id, 'detail'])
      queryClient.setQueryData(
        ['feed', id, 'subscription'],
        produce((draft: any) => {
          if (draft) draft.subscribed = action === 'subscribe'
        }),
      )
      queryClient.setQueryData(
        ['feed', id, 'detail'],
        produce((draft: any) => {
          if (!draft) return
          draft.subscriberCount = Math.max(0, (draft.subscriberCount ?? 0) + (action === 'subscribe' ? 1 : -1))
        }),
      )
      return { prevSub, prevFeed }
    },
    onError: (err, _v, ctx) => {
      queryClient.setQueryData(['feed', id, 'subscription'], ctx?.prevSub)
      queryClient.setQueryData(['feed', id, 'detail'], ctx?.prevFeed)
      Alert.alert('操作失败', (err as Error).message || '订阅操作失败')
    },
    onSettled: () => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ['feed', id, 'subscription'] }),
        queryClient.invalidateQueries({ queryKey: ['feed', id, 'detail'] }),
        queryClient.invalidateQueries({ queryKey: ['subscription', 'list'] }),
      ])
    },
  })

  const subscribed = subscription?.subscribed

  if (feedQuery.isPending) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center gap-3 px-4 py-3">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <ArrowLeft size={22} color="#0a0a0a" />
          </Pressable>
          <Skeleton className="h-5 w-40" />
        </View>
        <View className="px-4">
          <FeedHeaderSkeleton />
          <View className="mt-4 gap-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-72 w-full rounded-xl" />)}
          </View>
        </View>
      </SafeAreaView>
    )
  }

  if (feedQuery.isError || !feed) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center gap-3 px-4 py-3">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <ArrowLeft size={22} color="#0a0a0a" />
          </Pressable>
        </View>
        <ErrorState onRetry={() => void feedQuery.refetch()} />
      </SafeAreaView>
    )
  }

  const description = feed.description?.trim() || feed.url || '暂无简介'

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 border-b border-border px-4 py-3">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ArrowLeft size={22} color="#0a0a0a" />
        </Pressable>
        <Text className="flex-1 text-base text-foreground" style={{ fontWeight: '600' }} numberOfLines={1}>
          {feed.title || '订阅源'}
        </Text>
      </View>

      <FlatList
        data={articles}
        keyExtractor={(item) => String(item.id)}
        contentContainerClassName="px-4 pb-6"
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {
              void feedQuery.refetch()
              void articlesQuery.refetch()
            }}
          />
        }
        ListHeaderComponent={
          <View className="mb-4 mt-4 gap-4 rounded-2xl border border-border/60 bg-card p-4">
            <View className="flex-row items-center gap-3">
              <Avatar src={feed.image} fallback={feed.title} size={48} />
              <View className="flex-1">
                <View className="flex-row items-center gap-1">
                  <Text className="text-lg text-foreground" style={{ fontWeight: '600' }} numberOfLines={1}>
                    {feed.title || '未命名订阅源'}
                  </Text>
                  {feed.link && (
                    <Pressable onPress={() => Linking.openURL(feed.link!)} hitSlop={8}>
                      <ExternalLink size={16} color="hsl(0, 0%, 45.1%)" />
                    </Pressable>
                  )}
                </View>
                <Text className="text-sm text-muted-foreground" numberOfLines={2}>{description}</Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <Text className="text-xs text-muted-foreground">
                  订阅 <Text className="text-foreground"
                             style={{ fontWeight: '600' }}>{(feed.subscriberCount ?? 0).toLocaleString('zh-CN')}</Text>
                </Text>
                <View className="h-3 w-px bg-border" />
                <Text className="text-xs text-muted-foreground">
                  文章 <Text className="text-foreground" style={{ fontWeight: '600' }}>{articles.length.toLocaleString(
                  'zh-CN')}</Text>
                </Text>
              </View>
              <Button
                variant={subscribed ? 'outline' : 'default'}
                size="sm"
                className="w-24"
                onPress={() => {
                  if (!ensureAuthed()) return
                  void subscriptionMutation.mutateAsync(subscribed ? 'unsubscribe' : 'subscribe')
                }}
              >
                <Text>{subscribed ? '取消订阅' : '订阅'}</Text>
              </Button>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable className="mb-3" onPress={() => router.push(`/article/${item.id}` as any)}>
            <VerticalCard article={item} dense />
          </Pressable>
        )}
        ListEmptyComponent={
          articlesQuery.isPending
            ? <View className="gap-3">{[1, 2, 3].map((i) => <Skeleton key={i}
                                                                      className="h-72 w-full rounded-xl" />)}</View>
            : <EmptyState title="暂无文章" description="该订阅源暂时还没有可展示的文章。" />
        }
      />
    </SafeAreaView>
  )
}

const FeedHeaderSkeleton = () => (
  <View className="gap-4 rounded-2xl border border-border/60 bg-card p-4">
    <View className="flex-row items-center gap-3">
      <Skeleton className="h-12 w-12 rounded-full" />
      <View className="flex-1 gap-1.5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-64" />
      </View>
    </View>
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center gap-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
      </View>
      <Skeleton className="h-9 w-24 rounded-md" />
    </View>
  </View>
)
