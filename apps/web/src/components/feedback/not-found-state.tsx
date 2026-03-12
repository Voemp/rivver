import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'
import { MapPinOff } from 'lucide-react'

type NotFoundStateProps = {
  title?: string
  message?: string
  homeLabel?: string
}

export const NotFoundState = ({
                                title = '页面不存在',
                                message = '你访问的页面可能已被移动或删除。',
                                homeLabel = '返回首页',
                              }: NotFoundStateProps) => {
  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-background via-card to-muted/30 px-6 py-14 text-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_55%)]"
      />
      <div className="relative flex max-w-md flex-col items-center gap-3">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full border border-border/60 bg-background/70 shadow-sm">
          <MapPinOff className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{message}</p>
        <Button asChild className="mt-2">
          <Link to="/">{homeLabel}</Link>
        </Button>
      </div>
    </div>
  )
}
