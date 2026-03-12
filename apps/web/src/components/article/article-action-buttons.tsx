import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton.tsx'
import { cn } from '@/lib/utils'
import type { IconType } from '@/types/icon.ts'
import { Heart, Share2 } from 'lucide-react'

export type SharePlatform = 'copy' | 'x' | 'weibo' | 'telegram'

export type SharePlatformItem = {
  key: SharePlatform
  label: string
  icon: IconType
}

type ArticleActionButtonsProps = {
  favorited: boolean | undefined
  sharePending: boolean
  sharePlatforms: SharePlatformItem[]
  ensureAuthed: () => boolean
  onFavorite: () => void
  onShare: (platform: SharePlatform) => void
  direction?: 'row' | 'column'
  dropdownSide?: 'top' | 'right' | 'bottom' | 'left'
  dropdownAlign?: 'start' | 'center' | 'end'
  className?: string
}

export const ArticleActionButtons = ({
                                       favorited = false,
                                       sharePending,
                                       sharePlatforms,
                                       onFavorite,
                                       onShare,
                                       direction = 'column',
                                       dropdownSide = 'top',
                                       dropdownAlign = 'end',
                                       className,
                                     }: ArticleActionButtonsProps) => {
  const buttonClassName =
    'h-10 w-10 rounded-full border-border/70 bg-background/80 shadow-none hover:bg-accent/50 supports-[backdrop-filter]:bg-background/65'

  return (
    <div
      className={cn(
        'flex gap-4',
        direction === 'column' ? 'flex-col items-start' : 'items-center',
        className,
      )}
    >
      <Button
        size="icon-lg"
        variant="outline"
        className={buttonClassName}
        onClick={onFavorite}
        aria-label={favorited ? '已收藏' : '收藏'}
        title={favorited ? '已收藏' : '收藏'}
      >
        <Heart className="size-4" fill={favorited ? 'currentColor' : 'none'} />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon-lg"
            variant="outline"
            className={buttonClassName}
            disabled={sharePending}
            aria-label="分享"
            title="分享"
          >
            <Share2 className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side={dropdownSide} align={dropdownAlign}
                             className="w-56 rounded-xl border-border/7 p-2 shadow-sm">
          <DropdownMenuLabel>分享菜单</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {sharePlatforms.map(({ key, label, icon: Icon }) => (
            <DropdownMenuItem
              key={key}
              onClick={() => onShare(key)}
              className="rounded-sm py-2.5"
            >
              <Icon className="size-4" />
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}


export const ArticleActionsSkeleton = () => (
  <div className="flex flex-col items-start gap-4 pt-6">
    <Skeleton className="size-10 rounded-full" />
    <Skeleton className="size-10 rounded-full" />
  </div>
)