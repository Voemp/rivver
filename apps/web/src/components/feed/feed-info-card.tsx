import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton.tsx'
import { cn } from '@/lib/utils'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'

export type FeedInfo = {
  id: number
  title: string
  description: string | null
  image: string | null
  url: string
  subscriberCount: number | null
}

type FeedInfoCardProps = {
  feed: FeedInfo
  subscribed: boolean | undefined
  onSubscribe: () => void
  onUnsubscribe: () => void
  linkToFeed?: boolean
}

const formatSubscriberCount = (subscriberCount: number | null) => {
  return (subscriberCount ?? 0).toLocaleString('zh-CN')
}

const getFeedFallback = (title: string) => {
  const trimmedTitle = title.trim()

  if (!trimmedTitle) {
    return 'F'
  }

  return trimmedTitle.slice(0, 1).toUpperCase()
}

export const FeedInfoCard = ({
                               feed,
                               subscribed = false,
                               onSubscribe,
                               onUnsubscribe,
                               linkToFeed = false,
                             }: FeedInfoCardProps) => {
  const [confirmOpen, setConfirmOpen] = useState(false)

  const description = feed.description?.trim() || feed.url || '暂无简介'
  const linkLabel = feed.title ? `查看 ${feed.title}` : '查看订阅源'

  return (
    <div className="flex items-center gap-4 pb-4">
      {linkToFeed ? (
        <Link
          to="/feed/$id"
          params={{ id: feed.id }}
          aria-label={linkLabel}
          className="shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2"
        >
          <Avatar className="size-16 ring-1 ring-border/70">
            <AvatarImage src={feed.image ?? undefined} alt={feed.title} />
            <AvatarFallback className="text-sm font-semibold">
              {getFeedFallback(feed.title)}
            </AvatarFallback>
          </Avatar>
        </Link>
      ) : (
        <Avatar className="size-16 ring-1 ring-border/70">
          <AvatarImage src={feed.image ?? undefined} alt={feed.title} />
          <AvatarFallback className="text-sm font-semibold">
            {getFeedFallback(feed.title)}
          </AvatarFallback>
        </Avatar>
      )}

      <div className="min-w-0 flex-1 space-y-1">
        <div className="space-y-1">
          {linkToFeed ? (
            <Link
              to="/feed/$id"
              params={{ id: feed.id }}
              aria-label={linkLabel}
              className={cn(
                'group block rounded-md outline-none transition-colors',
                'focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2',
              )}
            >
              <p className="truncate text-sm font-semibold text-foreground group-hover:underline">
                {feed.title || '未命名订阅源'}
              </p>
              <p className="truncate text-xs leading-5 text-muted-foreground">
                {description}
              </p>
            </Link>
          ) : (
            <>
              <p className="truncate text-sm font-semibold text-foreground">
                {feed.title || '未命名订阅源'}
              </p>
              <p className="truncate text-xs leading-5 text-muted-foreground">
                {description}
              </p>
            </>
          )}
        </div>

        {subscribed ? (
          <Popover open={confirmOpen} onOpenChange={setConfirmOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full border-transparent bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              >
                已订阅
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 rounded-2xl p-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">确认取消订阅？</p>
                  <p className="text-xs leading-5 text-muted-foreground">
                    取消后，这个订阅源会从你的订阅列表里移除。
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmOpen(false)}
                  >
                    先保留
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setConfirmOpen(false)
                      onUnsubscribe()
                    }}
                  >
                    取消订阅
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <Button type="button" size="sm" className="w-full" onClick={onSubscribe}>
            {`订阅 ${formatSubscriberCount(feed.subscriberCount)}`}
          </Button>
        )}
      </div>
    </div>
  )
}

export const FeedInfoSkeleton = () => (
  <div className="flex items-center gap-4 pb-4">
    <Skeleton className="size-16 rounded-full" />
    <div className="min-w-0 flex-1 space-y-2">
      <div className="space-y-1">
        <Skeleton className="h-4 w-3/4 rounded-none" />
        <Skeleton className="h-3 w-full rounded-none" />
      </div>
      <Skeleton className="h-8 w-full" />
    </div>
  </div>
)
