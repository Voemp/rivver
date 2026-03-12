import { favoritesQueryOptions } from '@/api/queries'
import { VerticalCard } from '@/components/common/article-card.tsx'
import { EmptyState } from '@/components/feedback/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/favorites')({
  loader: ({ context }) => context.queryClient.ensureQueryData(favoritesQueryOptions(0, 10)),
  pendingComponent: FavoritesSkeleton,
  component: Favorites,
})

function Favorites() {
  const { data: items = [] } = useSuspenseQuery(favoritesQueryOptions(0, 10))

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Favorites</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">全部收藏</h1>
      </div>

      {items.length === 0 ? (
        <div className="mx-auto w-full max-w-3xl">
          <EmptyState title="暂无收藏" description="你收藏的文章会出现在这里。" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {items.map((item) => (
            <Link
              key={item.id}
              to="/article/$id"
              params={{ id: item.id }}
              className="group block h-80 outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2"
            >
              <VerticalCard article={item} dense />
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

const FavoriteCardSkeleton = () => (
  <div className="grid h-80 min-h-0 grid-rows-[56%_44%] overflow-hidden rounded-sm bg-transparent">
    <Skeleton className="h-full w-full rounded-none" />
    <div className="flex min-h-0 flex-col justify-between gap-2 p-2">
      <div className="space-y-2">
        <Skeleton className="h-4 w-5/6 rounded-none" />
        <Skeleton className="h-3.5 w-full rounded-none" />
        <Skeleton className="h-3.5 w-4/5 rounded-none" />
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Skeleton className="size-4.5 rounded-full" />
          <Skeleton className="h-3 w-20 rounded-none" />
        </div>
        <Skeleton className="h-3 w-12 rounded-none" />
      </div>
    </div>
  </div>
)

function FavoritesSkeleton() {
  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-3 w-24 rounded-none" />
        <Skeleton className="h-7 w-28 rounded-none" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <FavoriteCardSkeleton key={index} />
        ))}
      </div>
    </section>
  )
}
