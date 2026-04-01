import { Avatar } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'
import { formatRecentTime } from '@/utils/date'
import { useRouter } from 'expo-router'
import { Pressable, View } from 'react-native'

type ArticleTitleCardProps = {
  title: string
  author?: string | null
  pubDate?: string | null
  feed: { id: number; title: string; image?: string | null }
}

export const ArticleTitleCard = ({ title, author, pubDate, feed }: ArticleTitleCardProps) => {
  const router = useRouter()

  return (
    <View className="mb-4">
      <Text className="text-2xl leading-tight text-foreground" style={{ fontWeight: '700' }}>{title}</Text>
      <View className="mt-3 flex-row items-center gap-2">
        <Pressable className="flex-row items-center gap-2" onPress={() => router.push(`/feed/${feed.id}` as any)}>
          <Avatar src={feed.image} fallback={feed.title} size={24} />
          <Text className="text-sm text-foreground" style={{ fontWeight: '500' }}>{feed.title}</Text>
        </Pressable>
        {author && <Text className="text-sm text-muted-foreground">· {author}</Text>}
        {pubDate && <Text className="text-sm text-muted-foreground">· {formatRecentTime(pubDate)}</Text>}
      </View>
    </View>
  )
}

export const ArticleTitleSkeleton = () => (
  <View className="mb-4">
    <Skeleton className="mb-2 h-7 w-full" />
    <Skeleton className="mb-3 h-7 w-3/4" />
    <View className="flex-row items-center gap-2">
      <Skeleton className="h-6 w-6 rounded-full" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-16" />
    </View>
  </View>
)
