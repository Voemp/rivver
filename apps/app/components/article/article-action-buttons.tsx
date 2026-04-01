import { Skeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'
import { Heart, Share2 } from 'lucide-react-native'
import { Pressable, Share, View } from 'react-native'

type ArticleActionButtonsProps = {
  favorited?: boolean
  articleUrl?: string
  articleTitle?: string
  ensureAuthed: () => boolean
  onFavorite: () => void
  onShare: () => void
}

export const ArticleActionButtons = ({
                                       favorited,
                                       articleUrl,
                                       articleTitle,
                                       ensureAuthed,
                                       onFavorite,
                                       onShare,
                                     }: ArticleActionButtonsProps) => {
  const handleShare = async () => {
    if (!ensureAuthed()) return
    onShare()
    if (articleUrl) {
      try {
        await Share.share({
          title: articleTitle ?? '',
          url: articleUrl,
          message: articleUrl,
        })
      } catch {
      }
    }
  }

  return (
    <View className="flex-row items-center gap-1 border-t border-border pt-3">
      <Pressable
        className="flex-1 flex-row items-center justify-center gap-2 rounded-lg py-2.5"
        onPress={() => {
          if (!ensureAuthed()) return
          onFavorite()
        }}
      >
        <Heart
          size={20}
          color={favorited ? 'hsl(0, 84.2%, 60.2%)' : 'hsl(0, 0%, 45.1%)'}
          fill={favorited ? 'hsl(0, 84.2%, 60.2%)' : 'transparent'}
        />
        <Text className="text-sm text-muted-foreground">{favorited ? '已收藏' : '收藏'}</Text>
      </Pressable>

      <View className="h-5 w-px bg-border" />

      <Pressable
        className="flex-1 flex-row items-center justify-center gap-2 rounded-lg py-2.5"
        onPress={handleShare}
      >
        <Share2 size={20} color="hsl(0, 0%, 45.1%)" />
        <Text className="text-sm text-muted-foreground">分享</Text>
      </Pressable>
    </View>
  )
}

export const ArticleActionsSkeleton = () => (
  <View className="flex-row items-center gap-4 border-t border-border pt-3">
    <Skeleton className="h-10 flex-1 rounded-lg" />
    <Skeleton className="h-10 flex-1 rounded-lg" />
  </View>
)
