import { Avatar } from '@/components/ui/avatar'
import { Text } from '@/components/ui/text'
import type { ArticleItem } from '@/types/api'
import { formatRecentTime } from '@/utils/date'
import { Image } from 'expo-image'
import { View } from 'react-native'

export const ArticleCard = ({ article }: { article: ArticleItem }) => {
  const imageUrl = article.enclosure?.type?.startsWith('image') ? article.enclosure.url : null
  const feedTitle = article.feed?.title ?? '未知来源'

  return (
    <View className="flex-row overflow-hidden rounded-xl border border-border/60 bg-card p-3">
      <View className="flex-1 justify-between pr-3">
        <Text className="text-sm text-foreground" style={{ fontWeight: '600' }} numberOfLines={2}>
          {article.title}
        </Text>
        {article.contentSnippet && (
          <Text className="mt-1 text-xs text-muted-foreground" numberOfLines={2}>
            {article.contentSnippet}
          </Text>
        )}
        <View className="mt-2 flex-row items-center gap-1.5">
          <Avatar src={article.feed?.image} fallback={feedTitle} size={14} />
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {feedTitle}
          </Text>
          <Text className="text-xs text-muted-foreground">· {formatRecentTime(article.pubDate ?? null)}</Text>
        </View>
      </View>
      <View className="h-20 w-20 overflow-hidden rounded-lg bg-muted">
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-xl text-muted-foreground/40">📰</Text>
          </View>
        )}
      </View>
    </View>
  )
}
