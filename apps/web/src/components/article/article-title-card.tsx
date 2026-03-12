import type { FeedInfo } from '@/components/feed/feed-info-card.tsx'
import { Avatar, AvatarImage } from '@/components/ui/avatar.tsx'
import { Skeleton } from '@/components/ui/skeleton.tsx'
import { formatRecentTime } from '@/utils/date'

type ArticleTitleCardProps = {
  title: string | null
  author: string | null
  pubDate: Date | null
  feed: FeedInfo
}

export const ArticleTitleCard = ({ title, author, pubDate, feed }: ArticleTitleCardProps) => {
  return (
    <header className="mx-auto max-w-3xl pb-10 sm:pb-12">
      <div
        className="mb-6 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground/80">
        <span>Title</span>
        <span className="h-px w-12 bg-border/70" />
      </div>

      <div className="space-y-8">
        <h1
          className="text-4xl font-semibold leading-[1.06] tracking-[-0.04em] text-foreground text-balance sm:text-5xl lg:text-6xl">
          {title ?? 'Untitled Article'}
        </h1>

        <div className="grid gap-5 text-sm text-muted-foreground grid-cols-3 sm:text-left lg:grid-cols-2">
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground/75">Author</p>
            <p className="text-sm font-medium text-foreground">{author ?? 'Unknown'}</p>
          </div>

          <div className="space-y-1.5">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground/75">Published</p>
            <p className="text-sm font-medium text-foreground">{formatRecentTime(pubDate)}</p>
          </div>

          <div className="space-y-1.5 lg:hidden">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground/75">Feed</p>
            <div className="flex items-center space-x-1.5">
              <Avatar className="size-6 ring-1 ring-border/70">
                <AvatarImage src={feed.image ?? undefined} alt={feed.title} />
              </Avatar>
              <p className="text-sm font-medium text-foreground">{feed.title}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export const ArticleTitleSkeleton = () => (
  <header className="mx-auto max-w-3xl pb-10 sm:pb-12">
    <div className="mb-6 flex items-center gap-3">
      <Skeleton className="h-3 w-16 rounded-none" />
      <Skeleton className="h-px w-12 rounded-none" />
    </div>

    <div className="space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-10 w-full rounded-none sm:h-12" />
        <Skeleton className="h-10 w-5/6 rounded-none sm:h-12" />
      </div>

      <div className="grid grid-cols-3 gap-5 text-sm text-muted-foreground sm:text-left lg:grid-cols-2">
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-16 rounded-none" />
          <Skeleton className="h-4 w-24 rounded-none" />
        </div>

        <div className="space-y-1.5">
          <Skeleton className="h-3 w-20 rounded-none" />
          <Skeleton className="h-4 w-28 rounded-none" />
        </div>

        <div className="space-y-1.5 lg:hidden">
          <Skeleton className="h-3 w-14 rounded-none" />
          <div className="flex items-center space-x-1.5">
            <Skeleton className="size-6 rounded-full" />
            <Skeleton className="h-4 w-20 rounded-none" />
          </div>
        </div>
      </div>
    </div>
  </header>
)