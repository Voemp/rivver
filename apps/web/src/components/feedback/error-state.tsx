import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'
import { AlertCircle } from 'lucide-react'

type ErrorStateProps = {
  title?: string
  message?: string
  retryLabel?: string
  homeLabel?: string
  onRetry?: () => void
}

export const ErrorState = ({
                             title = '加载失败',
                             message = '请求未完成，请稍后重试。',
                             retryLabel = '重试',
                             homeLabel = '返回首页',
                             onRetry,
                           }: ErrorStateProps) => {
  const showRetry = typeof onRetry === 'function'

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-background via-card to-destructive/5 px-6 py-14 text-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(220,38,38,0.16),transparent_55%)]"
      />
      <div className="relative flex max-w-md flex-col items-center gap-3">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10 shadow-sm">
          <AlertCircle className="h-7 w-7 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{message}</p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {showRetry ? <Button onClick={onRetry}>{retryLabel}</Button> : null}
          <Button asChild variant={showRetry ? 'outline' : 'default'}>
            <Link to="/">{homeLabel}</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
