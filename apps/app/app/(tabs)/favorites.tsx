import { favoritesQueryOptions } from '@/api/queries'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { ArticleCard } from '@/components/home/home-article-card'
import { CollapsibleHeader, useCollapsibleScroll } from '@/components/layout/collapsible-header'
import { Skeleton } from '@/components/ui/skeleton'
import type { ArticleItem } from '@/types/api'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { FlatList, Pressable, RefreshControl, View } from 'react-native'

export default function FavoritesScreen() {
  const router = useRouter()
  const query = useQuery(favoritesQueryOptions(0, 50))
  const items = (query.data ?? []) as ArticleItem[]
  const { scrollY, onScroll } = useCollapsibleScroll()

  if (query.isPending) {
    return (
      <View className="flex-1 bg-background">
        <CollapsibleHeader title="全部收藏" subtitle="Favorites" scrollY={scrollY} />
        <View className="gap-3 px-4 pt-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </View>
      </View>
    )
  }

  if (query.isError) {
    return (
      <View className="flex-1 bg-background">
        <CollapsibleHeader title="全部收藏" subtitle="Favorites" scrollY={scrollY} />
        <ErrorState onRetry={() => void query.refetch()} />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-background">
      <CollapsibleHeader title="全部收藏" subtitle="Favorites" scrollY={scrollY} />
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerClassName="px-4 pb-6 pt-3"
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => void query.refetch()} />}
        renderItem={({ item }) => (
          <Pressable className="mb-2.5" onPress={() => router.push(`/article/${item.id}` as any)}>
            <ArticleCard article={item} />
          </Pressable>
        )}
        ListEmptyComponent={<EmptyState title="暂无收藏" description="你收藏的文章会出现在这里。" />}
      />
    </View>
  )
}
