import { articlesInfiniteOptions } from '@/api/queries'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { ArticleCard } from '@/components/home/home-article-card'
import { CollapsibleHeader, useCollapsibleScroll } from '@/components/layout/collapsible-header'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Text } from '@/components/ui/text'
import { env } from '@/config/env'
import { useAuth } from '@/hooks/use-auth'
import type { ArticleItem } from '@/types/api'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useCallback, useMemo } from 'react'
import { FlatList, Pressable, RefreshControl, View } from 'react-native'

export default function HomeScreen() {
  const pageSize = env.articleListPageSize
  const { isAuthed } = useAuth()
  const router = useRouter()
  const query = useInfiniteQuery(articlesInfiniteOptions(isAuthed, pageSize))
  const { scrollY, onScroll } = useCollapsibleScroll()

  const items = useMemo(() => {
    const raw = (query.data?.pages.flatMap((page) => page) ?? []) as ArticleItem[]
    const map = new Map<number, ArticleItem>()
    for (const item of raw) map.set(item.id, item)
    return [...map.values()]
  }, [query.data?.pages])

  const onEndReached = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage()
    }
  }, [query])

  if (query.isPending) {
    return (
      <View className="flex-1 bg-background">
        <CollapsibleHeader title="精选推荐" subtitle="Featured" scrollY={scrollY} />
        <View className="gap-3 px-4 pt-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </View>
      </View>
    )
  }

  if (query.isError) {
    return (
      <View className="flex-1 bg-background">
        <CollapsibleHeader title="精选推荐" subtitle="Featured" scrollY={scrollY} />
        <ErrorState onRetry={() => void query.refetch()} />
      </View>
    )
  }

  if (items.length === 0) {
    return (
      <View className="flex-1 bg-background">
        <CollapsibleHeader title="精选推荐" subtitle="Featured" scrollY={scrollY} />
        <EmptyState title="暂无内容" description="稍后回来看看，系统正在整理新文章。" />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-background">
      <CollapsibleHeader title="精选推荐" subtitle="Featured" scrollY={scrollY} />
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerClassName="px-4 pb-6 pt-3"
        onScroll={onScroll}
        scrollEventThrottle={16}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => void query.refetch()} />
        }
        renderItem={({ item }) => (
          <Pressable className="mb-2.5" onPress={() => router.push(`/article/${item.id}` as any)}>
            <ArticleCard article={item} />
          </Pressable>
        )}
        ListFooterComponent={
          <View className="items-center py-4">
            {query.isFetchingNextPage ? (
              <Spinner size="small" />
            ) : query.hasNextPage ? (
              <Text className="text-sm text-muted-foreground">上拉加载更多</Text>
            ) : items.length > 0 ? (
              <Text className="text-sm text-muted-foreground">没有更多内容了</Text>
            ) : null}
          </View>
        }
      />
    </View>
  )
}
