import { articleSearchQueryOptions } from '@/api/queries'
import { VerticalCard } from '@/components/common/article-card'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { type ChangeEvent, useEffect, useState } from 'react'
import { z } from 'zod'

const searchPageSchema = z.object({
  q: z.string().trim().optional(),
})

export const Route = createFileRoute('/search')({
  validateSearch: search => searchPageSchema.parse(search),
  loaderDeps: ({ search }) => ({ q: search.q?.trim() ?? '' }),
  loader: async ({ context, deps: { q } }) => {
    if (!q) return null
    await context.queryClient.ensureQueryData(articleSearchQueryOptions(q))
    return null
  },
  pendingComponent: SearchPageSkeleton,
  component: SearchPage,
})

function SearchPage() {
  const navigate = useNavigate({ from: '/search' })
  const { q = '' } = Route.useSearch()
  const [value, setValue] = useState(q)

  useEffect(() => {
    setValue(q)
  }, [q])

  const query = useQuery({
    ...articleSearchQueryOptions(q),
    enabled: q.trim().length > 0,
  })

  const handleSubmit = (event: ChangeEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextQuery = value.trim()

    void navigate({
      to: '/search',
      search: nextQuery ? { q: nextQuery } : {},
    })
  }

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Article Search</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">搜索文章</h1>
        </div>

        <form onSubmit={handleSubmit} className="mx-auto w-full max-w-xl">
          <div className="relative">
            <Input
              value={value}
              onChange={event => setValue(event.target.value)}
              placeholder="搜索标题、摘要或正文片段"
              className="h-11 rounded-full pl-4 pr-14 text-sm"
            />
            <button
              type="submit"
              className="absolute right-1 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="提交搜索"
            >
              <Search className="size-4.5" />
            </button>
          </div>
        </form>
      </div>

      {!q.trim() ? (
        <EmptyState
          title="输入关键词开始搜索"
          description="支持标题、摘要和正文片段检索，并包含模糊匹配。"
        />
      ) : query.isPending ? (
        <SearchPageSkeleton />
      ) : query.isError ? (
        <ErrorState
          title="搜索失败"
          message="未能获取搜索结果，请稍后重试。"
          onRetry={() => void query.refetch()}
        />
      ) : query.data.length === 0 ? (
        <EmptyState
          title="没有找到相关文章"
          description={`没有匹配“${q}”的文章，试试更短的关键词或不同表达。`}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Results</p>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">“{q}” 的搜索结果</h2>
            </div>
            <p className="text-sm text-muted-foreground">{query.data.length} 条结果</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {query.data.map((item) => (
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
        </div>
      )}
    </section>
  )
}

function SearchPageSkeleton() {
  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-28 rounded-none" />
          <Skeleton className="h-7 w-36 rounded-none" />
        </div>
        <Skeleton className="mx-auto h-11 w-full max-w-2xl rounded-full" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-80 rounded-none" />
        ))}
      </div>
    </section>
  )
}
