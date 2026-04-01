import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { RefreshCw, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

type ArticleAiSummaryCardProps = {
  summary: string | null
  pending: boolean
  errorMessage?: string
  onRetry?: () => void
  layout?: 'aside' | 'inline'
  className?: string
}

export const ArticleAiSummaryCard = ({
                                       summary,
                                       pending,
                                       errorMessage,
                                       onRetry,
                                       layout = 'inline',
                                       className,
                                     }: ArticleAiSummaryCardProps) => {
  const contentMaxHeightClass = layout === 'aside'
    ? 'max-h-[calc(100dvh-16rem)]'
    : 'max-h-72 sm:max-h-80'

  return (
    <section className={cn('relative overflow-hidden rounded-4xl p-px', className)}>
      <div className="ai-summary-glow absolute inset-0" aria-hidden="true" />
      <div className="ai-summary-beam absolute inset-0" aria-hidden="true" />

      <div
        className="relative rounded-[25px] border border-border/60 bg-background/92 px-5 py-5 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.55)] backdrop-blur-xl sm:px-6 sm:py-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div
              className="flex size-9 items-center justify-center rounded-2xl bg-linear-to-br from-chart-2/18 via-chart-4/16 to-chart-1/20 text-chart-3">
              <Sparkles className="size-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground/85">AI Summary</p>
              <p className="text-sm font-medium text-foreground">Quick scan before you dive in</p>
            </div>
          </div>

          {pending ? (
            <div
              className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs text-muted-foreground">
              <Spinner className="size-3.5" />
              Generating
            </div>
          ) : null}
        </div>

        <div className={cn('overflow-y-auto pr-1', contentMaxHeightClass)}>
          {summary ? (
            <div
              className={cn(
                'text-sm leading-6 text-foreground/90',
                '[&_p]:my-3 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0',
                '[&_ul]:my-3 [&_ul]:space-y-3 [&_ul]:pl-0',
                '[&_ol]:my-3 [&_ol]:space-y-3 [&_ol]:pl-5',
                '[&_li]:ml-0 [&_li]:list-none',
                '[&_li]:before:mr-3 [&_li]:before:inline-block [&_li]:before:size-1.5 [&_li]:before:rounded-full [&_li]:before:bg-chart-2 [&_li]:before:align-middle [&_li]:before:content-[\'\']',
                '[&_ol_li]:list-decimal [&_ol_li]:ml-4 [&_ol_li]:before:hidden',
                '[&_strong]:font-semibold [&_strong]:text-foreground',
                '[&_em]:text-foreground/80',
                '[&_code]:rounded-sm [&_code]:bg-accent/70 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.92em]',
                '[&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:border [&_pre]:border-border/60 [&_pre]:bg-muted/40 [&_pre]:p-4',
                '[&_pre_code]:bg-transparent [&_pre_code]:p-0',
                '[&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:decoration-primary/35 [&_a]:underline-offset-4',
              )}
            >
              <ReactMarkdown>{summary}</ReactMarkdown>
            </div>
          ) : pending ? (
            <ArticleAiSummarySkeleton />
          ) : errorMessage ? (
            <div className="space-y-4">
              <p className="text-sm leading-6 text-muted-foreground">
                {errorMessage}
              </p>
              {onRetry ? (
                <Button variant="outline" size="sm" className="rounded-full" onClick={onRetry}>
                  <RefreshCw className="size-3.5" />
                  Retry
                </Button>
              ) : null}
            </div>
          ) : (
            <p className="text-sm leading-6 text-muted-foreground">
              Summary will appear here after the article content is processed.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

export const ArticleAiSummarySkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-4 w-11/12 rounded-none" />
    <Skeleton className="h-4 w-full rounded-none" />
    <Skeleton className="h-4 w-10/12 rounded-none" />
    <Skeleton className="h-4 w-9/12 rounded-none" />
  </div>
)
