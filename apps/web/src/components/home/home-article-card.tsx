import { AsideCard, FlowCard, type HomeArticleItem, VerticalCard } from '@/components/common/article-card.tsx'

export type { HomeArticleItem } from '@/components/common/article-card.tsx'

type HomeArticleCardProps = {
  article: HomeArticleItem
  variant: 'feature' | 'stack' | 'aside' | 'flow'
  reverse?: boolean
}

export const HomeArticleCard = ({ article, variant, reverse = false }: HomeArticleCardProps) => {
  if (variant === 'feature') {
    return <VerticalCard article={article} />
  }

  if (variant === 'stack') {
    return <VerticalCard article={article} dense />
  }

  if (variant === 'aside') {
    return <AsideCard article={article} />
  }

  return <FlowCard article={article} reverse={reverse} />
}
