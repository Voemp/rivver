import { Skeleton } from '@/components/ui/skeleton'
import { useWindowDimensions, View } from 'react-native'
import RenderHtml from 'react-native-render-html'

type ArticleContentCardProps = {
  content: string
}

const tagsStyles = {
  body: { color: '#0a0a0a', fontSize: 16, lineHeight: 26 },
  p: { marginBottom: 12 },
  h1: { fontSize: 24, fontWeight: 'bold' as const, marginTop: 20, marginBottom: 8 },
  h2: { fontSize: 20, fontWeight: 'bold' as const, marginTop: 18, marginBottom: 6 },
  h3: { fontSize: 18, fontWeight: '600' as const, marginTop: 16, marginBottom: 4 },
  a: { color: '#0a0a0a', textDecorationLine: 'underline' as const },
  img: { marginVertical: 8 },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: '#e5e5e5',
    paddingLeft: 12,
    marginVertical: 8,
    fontStyle: 'italic' as const,
    color: '#737373',
  },
  pre: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 6,
    marginVertical: 8,
    overflow: 'hidden' as const,
  },
  code: { backgroundColor: '#f5f5f5', paddingHorizontal: 4, borderRadius: 3, fontSize: 14 },
  ul: { marginBottom: 8 },
  ol: { marginBottom: 8 },
  li: { marginBottom: 4 },
}

export const ArticleContentCard = ({ content }: ArticleContentCardProps) => {
  const { width } = useWindowDimensions()
  const contentWidth = width - 32

  if (!content) return null

  return (
    <View className="py-4">
      <RenderHtml
        contentWidth={contentWidth}
        source={{ html: content }}
        tagsStyles={tagsStyles}
        enableExperimentalMarginCollapsing
      />
    </View>
  )
}

export const ArticleContentSkeleton = () => (
  <View className="gap-3 py-4">
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-5/6" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-4/5" />
    <Skeleton className="h-40 w-full rounded-lg" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-3/4" />
  </View>
)
