import { Inbox } from 'lucide-react'

type EmptyStateProps = {
  title?: string
  description?: string
  action?: React.ReactNode
}

export const EmptyState = ({
                             title = '暂无内容',
                             description = '当前没有可展示的数据。',
                             action,
                           }: EmptyStateProps) => {
  return (
    <div
      className="relative flex min-h-[42vh] items-center justify-center overflow-hidden bg-linear-to-br from-background via-card to-muted/30 px-6 py-14 text-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(15,23,42,0.08),transparent_55%)]"
      />
      <div className="relative flex max-w-md flex-col items-center gap-3">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full border border-border/60 bg-background/70 shadow-sm">
          <Inbox className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
        {action}
      </div>
    </div>
  )
}
