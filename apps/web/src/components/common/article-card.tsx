import type { appClient } from '@/api/client.ts'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx'
import { cn } from '@/lib/utils.ts'
import { formatRecentTime } from '@/utils/date.ts'
import type { Treaty } from '@elysiajs/eden'
import { ArrowUpRight } from 'lucide-react'

export type HomeArticleItem = Treaty.Data<typeof appClient.article.recommendation.get>[number]

type ArticleMetaProps = {
  article: HomeArticleItem
  compact?: boolean
  className?: string
}

type VerticalCardProps = {
  article: HomeArticleItem
  dense?: boolean
  className?: string
}

type AsideCardProps = {
  article: HomeArticleItem
  className?: string
}

type FlowCardProps = {
  article: HomeArticleItem
  reverse?: boolean
  className?: string
}

const getCardImage = (article: HomeArticleItem) => {
  const enclosure = article.enclosure
  if (enclosure?.type?.startsWith('image/')) {
    return enclosure.url
  }

  if (article.feed?.image) {
    return article.feed.image
  }

  return `https://picsum.photos/seed/rivver-home-${article.id}/960/540`
}

export const ArticleMeta = ({ article, compact = false, className }: ArticleMetaProps) => {
  const feedName = article.feed?.title?.trim() || '未知来源'
  const feedInitial = feedName.slice(0, 1).toUpperCase()

  return (
    <div className={cn('flex items-center justify-between gap-2 text-muted-foreground', className)}>
      <div className="min-w-0 flex items-center gap-2">
        <Avatar className={cn('shrink-0', compact ? 'size-4.5' : 'size-5')}>
          <AvatarImage src={article.feed?.image ?? undefined} alt={feedName} />
          <AvatarFallback className="text-[9px]">{feedInitial}</AvatarFallback>
        </Avatar>
        <span className={cn('truncate', compact ? 'text-[11px]' : 'text-xs')}>{feedName}</span>
      </div>
      <time
        dateTime={article.pubDate ? new Date(article.pubDate).toISOString() : undefined}
        className={cn(
          'shrink-0 translate-y-1 transition-all duration-200',
          'group-hover:opacity-0 group-hover:translate-y-0',
          compact ? 'text-[10px]' : 'text-[11px]',
        )}
      >
        {formatRecentTime(article.pubDate)}
      </time>
    </div>
  )
}

export const VerticalCard = ({ article, dense = false, className }: VerticalCardProps) => {
  const image = getCardImage(article)

  return (
    <div
      className={cn(
        'grid h-full min-h-0 overflow-hidden rounded-sm bg-transparent transition-shadow duration-200',
        dense ? 'grid-rows-[56%_44%]' : 'grid-rows-[60%_40%]',
        className,
      )}
    >
      <div className="min-h-0 overflow-hidden bg-muted/60">
        <img src={image} alt={article.title ?? '未命名文章'} referrerPolicy="no-referrer" loading="lazy"
             className="size-full object-cover transition-transform duration-300 ease-out group-hover:scale-105" />
      </div>

      <div className="relative flex min-h-0 flex-col justify-between gap-2 p-2">
        <div>
          <h3
            className={cn(
              'font-semibold tracking-tight text-foreground transition-all group-hover:underline',
              dense ? 'mb-2 line-clamp-2 text-base leading-6' : 'mb-4 line-clamp-3 text-2xl leading-8',
            )}
          >
            {article.title ?? '未命名文章'}
          </h3>
          <p
            className={cn(
              'text-muted-foreground',
              dense ? 'line-clamp-2 text-sm leading-6' : 'line-clamp-3 text-base leading-7',
            )}
          >
            {article.summary?.trim() || '暂无摘要'}
          </p>
        </div>
        <ArticleMeta article={article} compact={dense} />

        <div
          className={cn(
            'pointer-events-none absolute bottom-2 right-2',
            'opacity-0 translate-y-1 transition-all duration-200',
            'group-hover:opacity-100 group-hover:translate-y-0',
          )}
        >
          <ArrowUpRight className="size-5 text-muted-foreground/80" />
        </div>
      </div>
    </div>
  )
}

export const AsideCard = ({ article, className }: AsideCardProps) => {
  const image = getCardImage(article)

  return (
    <div
      className={cn(
        'grid h-full min-h-0 grid-cols-[minmax(0,1fr)_34%] gap-3 overflow-hidden rounded-sm',
        className,
      )}
    >
      <div className="relative flex min-w-0 flex-col justify-between gap-1.5 p-2">
        <div>
          <h3
            className="mb-2 line-clamp-2 text-sm font-semibold leading-5 tracking-tight text-foreground transition-all group-hover:underline">
            {article.title ?? '未命名文章'}
          </h3>
          <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
            {article.summary?.trim() || '暂无摘要'}
          </p>
        </div>
        <ArticleMeta article={article} compact />

        <div
          className={cn(
            'pointer-events-none absolute bottom-2 right-2',
            'opacity-0 translate-y-1 transition-all duration-200',
            'group-hover:opacity-100 group-hover:translate-y-0',
          )}
        >
          <ArrowUpRight className="size-5 text-muted-foreground/80" />
        </div>
      </div>

      <div className="h-full min-h-0 overflow-hidden bg-muted/60">
        <img src={image} alt={article.title ?? '未命名文章'} referrerPolicy="no-referrer" loading="lazy"
             className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105" />
      </div>

    </div>
  )
}

export const FlowCard = ({ article, reverse = false, className }: FlowCardProps) => {
  const image = getCardImage(article)

  return (
    <div
      className={cn(
        'grid items-stretch gap-3 overflow-hidden rounded-sm bg-transparent transition-shadow duration-200',
        reverse ? 'grid-cols-[minmax(0,1fr)_42%]' : 'grid-cols-[42%_minmax(0,1fr)]',
        className,
      )}
    >
      <div
        className={cn(
          'h-full min-h-40 max-h-0 overflow-hidden bg-muted/60',
          reverse ? 'order-2' : 'order-1',
        )}
      >
        <img src={image} alt={article.title ?? '未命名文章'} referrerPolicy="no-referrer" loading="lazy"
             className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105" />
      </div>

      <div
        className={cn('relative flex min-w-0 flex-col justify-between gap-1.5 p-2', reverse ? 'order-1' : 'order-2')}>
        <div>
          <h3
            className="mb-2 line-clamp-2 text-base font-semibold leading-6 tracking-tight text-foreground transition-all group-hover:underline">
            {article.title ?? '未命名文章'}
          </h3>
          <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
            {article.summary?.trim() || '暂无摘要'}
          </p>
        </div>
        <ArticleMeta article={article} />

        <div
          className={cn(
            'pointer-events-none absolute bottom-2 right-2',
            'opacity-0 translate-y-1 transition-all duration-200',
            'group-hover:opacity-100 group-hover:translate-y-0',
          )}
        >
          <ArrowUpRight className="size-5 text-muted-foreground/80" />
        </div>
      </div>
    </div>
  )
}
