import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'
import type { Feed } from '@/types/api'
import { useRouter } from 'expo-router'
import { Pressable, View } from 'react-native'

type FeedInfoCardProps = {
  feed: Feed
  subscribed?: boolean
  linkToFeed?: boolean
  onSubscribe?: () => void
  onUnsubscribe?: () => void
}

export const FeedInfoCard = ({ feed, subscribed, linkToFeed, onSubscribe, onUnsubscribe }: FeedInfoCardProps) => {
  const router = useRouter()
  const description = feed.description?.trim() || feed.url || '暂无简介'

  return (
    <View className="gap-3 rounded-xl border border-border/60 bg-card p-4">
      <View className="flex-row items-center gap-3">
        <Avatar src={feed.image} fallback={feed.title} size={40} />
        <View className="flex-1">
          <Pressable
            disabled={!linkToFeed}
            onPress={() => linkToFeed && router.push(`/feed/${feed.id}` as any)}
          >
            <Text className="text-base text-foreground" style={{ fontWeight: '600' }} numberOfLines={1}>
              {feed.title || '未命名订阅源'}
            </Text>
          </Pressable>
          <Text className="text-xs text-muted-foreground">
            {feed.subscriberCount.toLocaleString('zh-CN')} 位订阅者
          </Text>
        </View>
      </View>

      <Text className="text-sm text-muted-foreground" numberOfLines={3}>
        {description}
      </Text>

      <Button
        variant={subscribed ? 'outline' : 'default'}
        size="sm"
        onPress={subscribed ? onUnsubscribe : onSubscribe}
      >
        <Text>{subscribed ? '取消订阅' : '订阅'}</Text>
      </Button>
    </View>
  )
}

export const FeedInfoSkeleton = () => (
  <View className="gap-3 rounded-xl border border-border/60 bg-card p-4">
    <View className="flex-row items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <View className="flex-1 gap-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </View>
    </View>
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-9 w-full rounded-md" />
  </View>
)
