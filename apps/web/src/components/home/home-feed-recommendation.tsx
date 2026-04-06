import { feedPopularQueryOptions } from '@/api/queries'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { type ContentType, contentTypeLabels } from '@/types/content'
import { formatRecentTime } from '@/utils/date'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

type HomeFeedRecommendationProps = {
  contentType?: ContentType
}

const getFeedFallback = (title: string) => {
  const trimmed = title.trim()
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : 'F'
}

export const HomeFeedRecommendation = ({ contentType }: HomeFeedRecommendationProps) => {
  const query = useQuery(feedPopularQueryOptions(6, contentType))

  if (query.isPending) {
    return <HomeFeedRecommendationSkeleton />
  }

  if (query.isError || !query.data || query.data.length === 0) {
    return null
  }

  return (
    <aside className="hidden lg:block lg:w-72 xl:w-76">
      <div className="space-y-4">
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">popular feeds</p>
          <h3 className="text-lg font-semibold tracking-tight text-foreground">热门订阅源</h3>
        </header>

        <div className="space-y-3">
          {query.data.map((feed, index) => (
            <div key={feed.id}>
              <Link
                to="/feed/$id"
                params={{ id: feed.id }}
                className="group block rounded-md py-1 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="mt-0.5 size-10 ring-1 ring-border/60">
                    <AvatarImage src={feed.image ?? undefined} alt={feed.title} />
                    <AvatarFallback className="text-xs font-semibold">
                      {getFeedFallback(feed.title)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-foreground group-hover:underline">
                        {feed.title || '未命名订阅源'}
                      </p>
                      <span className="shrink-0 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        {contentTypeLabels[feed.contentType]}
                      </span>
                    </div>

                    <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                      {feed.description?.trim() || feed.url}
                    </p>

                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span>{(feed.subscriberCount ?? 0).toLocaleString('zh-CN')} 订阅</span>
                      <span className="h-3 w-px bg-border/60" />
                      <span>{formatRecentTime(feed.lastFetchedAt)}</span>
                    </div>
                  </div>
                </div>
              </Link>

              {index < query.data.length - 1 ? <Separator className="mt-3" /> : null}
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}

export const HomeFeedRecommendationSkeleton = () => (
  <aside className="hidden lg:block lg:w-72 xl:w-76">
    <div className="space-y-4">
      <header className="space-y-1">
        <Skeleton className="h-3 w-28 rounded-none" />
        <Skeleton className="h-6 w-28 rounded-none" />
      </header>

      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index}>
            <div className="flex items-start gap-3 py-1">
              <Skeleton className="size-10 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-4/5 rounded-none" />
                <Skeleton className="h-3 w-full rounded-none" />
                <Skeleton className="h-3 w-5/6 rounded-none" />
                <Skeleton className="h-3 w-2/3 rounded-none" />
              </div>
            </div>
            {index < 5 ? <Separator className="mt-3" /> : null}
          </div>
        ))}
      </div>
    </div>
  </aside>
)
