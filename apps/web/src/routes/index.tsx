import { articlesInfiniteOptions } from '@/api/queries'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { HomeFeaturedSection, HomeFeaturedSectionSkeleton } from '@/components/home/home-featured-section.tsx'
import { HomeFlowSection, HomeFlowSectionSkeleton } from '@/components/home/home-flow-section.tsx'
import { Separator } from '@/components/ui/separator'
import { env } from '@/config/env'
import { useAuth } from '@/hooks/use-auth.tsx'
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll'
import { type ContentType, contentTypeOptions } from '@/types/content'
import { useInfiniteQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useMemo } from 'react'
import { z } from 'zod'

const contentTypeSearchSchema = z.object({
  type: z.enum(contentTypeOptions).optional(),
})

export const Route = createFileRoute('/')({
  validateSearch: search => contentTypeSearchSchema.parse(search),
  loader: async ({ context: { queryClient, isAuthed } }) => {
    const pageSize = env.articleListPageSize
    await queryClient.ensureInfiniteQueryData(articlesInfiniteOptions(isAuthed, pageSize))
  },
  pendingComponent: HomeSkeleton,
  component: Home,
})

function Home() {
  const pageSize = env.articleListPageSize
  const { isAuthed } = useAuth()
  const { type } = Route.useSearch() as { type?: ContentType }
  const query = useInfiniteQuery(articlesInfiniteOptions(isAuthed, pageSize, type))

  const items = useMemo(() => {
    const raw = query.data?.pages.flatMap((page) => page) ?? []
    const map = new Map<number, (typeof raw)[number]>()
    for (const item of raw) {
      map.set(item.id, item)
    }
    return [...map.values()]
  }, [query.data?.pages])

  const { targetRef } = useInfiniteScroll({
    disabled: !query.hasNextPage || query.isFetchingNextPage,
    onLoadMore: () => void query.fetchNextPage(),
  })

  if (query.isPending) {
    return <HomeSkeleton />
  }

  if (query.isError) {
    return <ErrorState onRetry={() => void query.refetch()} />
  }

  if (items.length === 0) {
    return <EmptyState title="暂无内容" description="稍后回来看看，系统正在整理新文章。" />
  }

  return (
    <section className="space-y-10">
      <HomeFeaturedSection items={items} />

      <Separator className="hidden sm:block" />

      <HomeFlowSection items={items} />

      <div ref={targetRef} className="py-4 text-center text-sm text-muted-foreground">
        {query.isFetchingNextPage ? '加载更多中...' : query.hasNextPage ? '下拉加载更多' : '没有更多内容了'}
      </div>
    </section>
  )
}

function HomeSkeleton() {
  return (
    <section className="space-y-10">
      <HomeFeaturedSectionSkeleton />
      <Separator />
      <HomeFlowSectionSkeleton />
    </section>
  )
}
