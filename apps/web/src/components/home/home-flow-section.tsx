import type { HomeArticleItem } from '@/components/common/article-card.tsx'
import { HomeArticleCard } from '@/components/home/home-article-card.tsx'
import { Separator } from '@/components/ui/separator.tsx'
import { Skeleton } from '@/components/ui/skeleton.tsx'
import { Link } from '@tanstack/react-router'

export const FlowLink = ({ article, reverse }: { article: HomeArticleItem; reverse: boolean }) => {
  return (
    <Link
      to="/article/$id"
      params={{ id: article.id }}
      className="group block outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2"
    >
      <HomeArticleCard article={article} variant="flow" reverse={reverse} />
    </Link>
  )
}

export const FlowList = ({ items, className }: { items: HomeArticleItem[]; className?: string }) => {
  if (items.length === 0) {
    return <div className={className} />
  }

  return (
    <div className={className}>
      {items.map((item, index) => (
        <div key={item.id}>
          <FlowLink article={item} reverse={index % 2 === 1} />
          {index < items.length - 1 ? <Separator className="my-2" /> : null}
        </div>
      ))}
    </div>
  )
}

export const HomeFlowSection = ({ items }: { items: HomeArticleItem[] }) => {
  return (
    <section className="space-y-3 sm:mx-auto sm:w-full sm:max-w-xl lg:max-w-[48vw]">
      <h2 className="hidden text-lg font-semibold tracking-tight text-foreground sm:block">流式列表</h2>

      <FlowList items={items.slice(8)} className="hidden lg:block" />
      <FlowList items={items.slice(3)} className="hidden sm:block lg:hidden" />
      <FlowList items={items} className="sm:hidden" />
    </section>
  )
}

export const HomeFlowSectionSkeleton = () => {
  return (
    <div className="space-y-3 lg:mx-auto lg:w-full lg:max-w-2xl xl:max-w-[36vw] 2xl:max-w-[34vw]">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-40 rounded-none" />
      ))}
    </div>
  )
}
