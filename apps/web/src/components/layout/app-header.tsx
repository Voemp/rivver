import rivverLogo from '@/assets/rivver_logo.svg'
import rivverText from '@/assets/rivver_text.svg'
import { AuthDialog } from '@/components/auth/auth-dialog'
import { SettingsDialog } from '@/components/profile/settings-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator.tsx'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import { type ContentType, contentTypeLabels, contentTypeOptions } from '@/types/content'
import { Link, useLocation } from '@tanstack/react-router'
import { LogOut, Rss, Star, UserRound } from 'lucide-react'
import { useState } from 'react'

export const AppHeader = () => {
  const location = useLocation()
  const { session, signOut, openAuthDialog } = useAuth()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const searchParams = new URLSearchParams(location.searchStr)
  const activeContentType = location.pathname === '/'
    ? (searchParams.get('type') as ContentType | null)
    : null
  const showHomeFilters = location.pathname === '/'

  const favoritesActive = location.pathname.startsWith('/favorites')
  const subscriptionsActive = location.pathname.startsWith('/subscriptions')
  const navItemClassName = (active: boolean) => cn(
    'relative inline-flex shrink-0 items-center gap-1.5 px-3 py-3 text-sm leading-none font-medium whitespace-nowrap transition-colors',
    'after:absolute after:bottom-0 after:left-1/2 after:h-[2px] after:w-0 after:-translate-x-1/2 after:rounded-full after:transition-all after:duration-300',
    active
      ? 'text-foreground after:w-6 after:bg-primary'
      : 'text-muted-foreground hover:text-foreground hover:after:w-4 hover:after:bg-border',
  )
  const filterItemClassName = (active: boolean) => cn(
    'inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
    active
      ? 'bg-foreground text-background'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
  )

  return (
    <>
      <header
        className="sticky top-0 z-30 border-b border-border/70 bg-card/86 backdrop-blur supports-backdrop-filter:bg-card/78">
        <div className="mx-auto flex w-full max-w-420 items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
          <div className="inline-flex flex-1 items-center justify-start rounded-xl text-foreground transition-colors">
            <Link to="/" className="inline-flex">
              <img src={rivverLogo} alt="rivver_logo" className="h-8" />
              <img src={rivverText} alt="rivver_text" className="block h-8 sm:hidden" />
            </Link>
            {showHomeFilters ? (
              <div className="ml-4 hidden items-center gap-1.5 sm:flex">
                {contentTypeOptions.map((type) => (
                  <Link
                    to="/"
                    key={type}
                    href={`/?type=${type}`}
                    className={filterItemClassName(activeContentType === type)}
                  >
                    {contentTypeLabels[type]}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          <div className="hidden shrink-0 sm:block">
            <img src={rivverText} alt="rivver_text" className="h-10" />
          </div>

          <div className="flex flex-1 h-4 items-center justify-end gap-2">
            {session?.user ? (
              <>
                <Link
                  to="/favorites"
                  className={navItemClassName(favoritesActive)}
                >
                  <Star className="size-4" />
                  收藏
                </Link>
                <Separator orientation="vertical" className="opacity-50" />
                <Link
                  to="/subscriptions"
                  className={navItemClassName(subscriptionsActive)}
                >
                  <Rss className="size-4" />
                  订阅
                </Link>
                <Separator orientation="vertical" className="mr-4 opacity-50" />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                      aria-label="打开用户菜单"
                    >
                      <Avatar className="size-9 ring-1 ring-border/70">
                        <AvatarImage src={session.user.image ?? undefined} alt={session.user.name} />
                        <AvatarFallback>{session.user.name.slice(0, 1).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-40 rounded-2xl p-2">
                    <DropdownMenuLabel className="truncate">{session.user.name}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="rounded-xl py-2.5" onSelect={() => setSettingsOpen(true)}>
                      <UserRound className="size-4" />
                      用户设置
                    </DropdownMenuItem>
                    <DropdownMenuItem className="rounded-xl py-2.5" onSelect={() => void signOut()}>
                      <LogOut className="size-4" />
                      退出登录
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button size="sm" className="cursor-pointer" onClick={() => openAuthDialog('sign-in')}>
                登录 / 注册
              </Button>
            )}
          </div>
        </div>
      </header>

      <AuthDialog />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  )
}
