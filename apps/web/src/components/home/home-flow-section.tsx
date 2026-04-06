import type { HomeArticleItem } from '@/components/common/article-card.tsx'
import { HomeArticleCard } from '@/components/home/home-article-card.tsx'
import { HomeFeedRecommendation, HomeFeedRecommendationSkeleton } from '@/components/home/home-feed-recommendation'
import { Separator } from '@/components/ui/separator.tsx'
import { Skeleton } from '@/components/ui/skeleton.tsx'
import { type ContentType } from '@/types/content'
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

export const HomeFlowSection = ({ items, contentType }: { items: HomeArticleItem[]; contentType?: ContentType }) => {
  return (
    <section className="space-y-3">
      <div
        className="hidden lg:grid lg:grid-cols-[minmax(0,40rem)_18rem] lg:justify-center lg:gap-x-12 xl:grid-cols-[minmax(0,42rem)_19rem]">
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">flow articles</p>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">流式列表</h2>
          </div>
          <FlowList items={items.slice(8)} />
        </div>
        <HomeFeedRecommendation contentType={contentType} />
      </div>

      <div className="hidden sm:block lg:hidden sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">flow articles</p>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">流式列表</h2>
        </div>
        <FlowList items={items.slice(3)} className="mt-3" />
      </div>

      <FlowList items={items} className="sm:hidden" />
    </section>
  )
}

export const HomeFlowSectionSkeleton = () => {
  return (
    <>
      <div
        className="hidden lg:grid lg:grid-cols-[minmax(0,40rem)_18rem] lg:justify-center lg:gap-x-12 xl:grid-cols-[minmax(0,42rem)_19rem]">
        <div className="space-y-3">
          <div className="space-y-1">
            <Skeleton className="h-3 w-24 rounded-none" />
            <Skeleton className="h-6 w-24 rounded-none" />
          </div>
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-none" />
          ))}
        </div>
        <HomeFeedRecommendationSkeleton />
      </div>

      <div className="hidden space-y-3 sm:mx-auto sm:block sm:w-full sm:max-w-xl lg:hidden">
        <div className="space-y-1">
          <Skeleton className="h-3 w-24 rounded-none" />
          <Skeleton className="h-6 w-24 rounded-none" />
        </div>
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-40 rounded-none" />
        ))}
      </div>

      <div className="space-y-3 sm:hidden">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-40 rounded-none" />
        ))}
      </div>
    </>
  )
}
