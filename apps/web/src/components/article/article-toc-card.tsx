import { Skeleton } from '@/components/ui/skeleton.tsx'
import { cn } from '@/lib/utils'
import { Link } from '@tanstack/react-router'

export type HeadingItem = {
  id: string
  text: string
  level: number
  progress: number
  active: boolean
}

type ArticleTocCardProps = {
  progress: number
  headings: HeadingItem[]
}

export const ArticleTocCard = ({ progress, headings }: ArticleTocCardProps) => {
  const clampedProgress = Math.max(0, Math.min(100, progress))
  const visibleHeadings = headings.slice(0, 12)

  return (
    <nav aria-label="Article contents" className="w-full min-w-0">
      <div className="space-y-3 pb-4">
        <div
          className="flex items-center justify-between gap-3 text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground/80">
          <span>Reading</span>
          <span className="text-foreground/90">{clampedProgress}%</span>
        </div>

        <div className="h-px bg-border/80">
          <div className="h-full bg-foreground/85 transition-[width] duration-300"
               style={{ width: `${clampedProgress}%` }} />
        </div>
      </div>

      <div className="mt-4 space-y-1 pl-4">
        {visibleHeadings.map((heading) => {
          const itemProgress = Math.max(0, Math.min(100, heading.progress))
          const isRead = itemProgress >= 100

          return (
            <Link
              key={heading.id}
              to="."
              hash={heading.id}
              replace={true}
              className={cn(
                'flex items-center gap-2 py-2 text-sm leading-5 transition-colors duration-200',
                heading.active
                  ? 'text-foreground -translate-y-0.5'
                  : isRead
                    ? 'text-foreground/72'
                    : 'text-muted-foreground hover:text-foreground',
              )}
              style={{ paddingLeft: `${Math.max(heading.level - 1, 0) * 10}px` }}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'mt-0.5 size-1.5 shrink-0 rounded-full transition-colors',
                  heading.active ? 'bg-foreground' : isRead ? 'bg-foreground/50' : 'bg-border',
                )}
              />
              <span className="min-w-0 flex-1 truncate">{heading.text}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export const ArticleTocSkeleton = () => (
  <div className="w-full min-w-0">
    <div className="space-y-3 pb-4">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-3 w-20 rounded-none" />
        <Skeleton className="h-3 w-10 rounded-none" />
      </div>
      <Skeleton className="h-px w-full rounded-none" />
    </div>

    <div className="mt-4 space-y-2 pl-4">
      {Array.from({ length: 8 }).map((_, index) => {
        const width = index % 3 === 0 ? 'w-5/6' : index % 2 === 0 ? 'w-2/3' : 'w-4/5'
        return (
          <div key={index} className="flex items-center gap-2">
            <Skeleton className="size-1.5 rounded-full" />
            <Skeleton className={`h-3 ${width} rounded-none`} />
          </div>
        )
      })}
    </div>
  </div>
)
