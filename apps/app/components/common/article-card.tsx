import { Avatar } from '@/components/ui/avatar'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'
import type { ArticleItem } from '@/types/api'
import { formatRecentTime } from '@/utils/date'
import { Image } from 'expo-image'
import { View } from 'react-native'

type VerticalCardProps = {
  article: ArticleItem
  dense?: boolean
  className?: string
}

export const VerticalCard = ({ article, dense, className }: VerticalCardProps) => {
  const imageUrl = article.enclosure?.type?.startsWith('image') ? article.enclosure.url : null
  const feedTitle = article.feed?.title ?? '未知来源'

  return (
    <View
      className={cn('overflow-hidden rounded-xl border border-border/60 bg-card', dense ? 'h-72' : 'h-80', className)}>
      <View className={cn('bg-muted', dense ? 'h-[52%]' : 'h-[56%]')}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        ) : (
          <View className="flex-1 items-center justify-center bg-muted">
            <Text className="text-3xl text-muted-foreground/40">📰</Text>
          </View>
        )}
      </View>
      <View className="flex-1 justify-between p-3">
        <View>
          <Text className="text-sm text-foreground" style={{ fontWeight: '600' }} numberOfLines={2}>
            {article.title}
          </Text>
          {!dense && article.contentSnippet && (
            <Text className="mt-1 text-xs text-muted-foreground" numberOfLines={2}>
              {article.contentSnippet}
            </Text>
          )}
        </View>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <Avatar src={article.feed?.image} fallback={feedTitle} size={16} />
            <Text className="text-xs text-muted-foreground" numberOfLines={1}>
              {feedTitle}
            </Text>
          </View>
          <Text className="text-xs text-muted-foreground">{formatRecentTime(article.pubDate ?? null)}</Text>
        </View>
      </View>
    </View>
  )
}
