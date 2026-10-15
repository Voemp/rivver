import { Sparkles } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

import styles from './article-ai-summary-card.module.css'

export const ArticleAiSummarySkeleton = () => {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-11/12 rounded-none" />
      <Skeleton className="h-4 w-full rounded-none" />
      <Skeleton className="h-4 w-10/12 rounded-none" />
      <Skeleton className="h-4 w-9/12 rounded-none" />
    </div>
  )
}

type ArticleAiSummarySkeletonCardProps = {
  layout?: 'aside' | 'inline'
  className?: string
}

export const ArticleAiSummarySkeletonCard = ({
  layout = 'aside',
  className,
}: ArticleAiSummarySkeletonCardProps) => {
  const contentMaxHeightClass =
    layout === 'aside' ? 'max-h-[calc(100dvh-16rem)]' : 'max-h-72 sm:max-h-80'

  return (
    <section className={cn('relative overflow-hidden rounded-4xl p-px', styles.root, className)}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.beam} aria-hidden="true" />

      <div
        className={cn(
          'relative rounded-[25px] px-5 py-5 sm:px-6 sm:py-6',
          'border border-border/60 bg-background/92 backdrop-blur-xl',
          'shadow-[0_24px_80px_-48px_rgba(15,23,42,0.55)]',
        )}
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex size-9 items-center justify-center rounded-2xl',
                'bg-linear-to-br from-teal-500/18 via-yellow-400/16 to-orange-500/20',
                'text-teal-600 dark:text-teal-400',
              )}
            >
              <Sparkles className="size-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium tracking-[0.22em] text-muted-foreground/85 uppercase">
                AI Summary
              </p>
              <p className="text-sm font-medium text-foreground">Quick scan before you dive in</p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs text-muted-foreground">
            <Spinner className="size-3.5" />
            Generating
          </div>
        </div>

        <div className={cn('overflow-y-auto pr-1', contentMaxHeightClass)}>
          <ArticleAiSummarySkeleton />
        </div>
      </div>
    </section>
  )
}
