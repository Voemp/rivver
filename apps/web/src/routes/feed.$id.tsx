import {
  deleteSubscription, feedArticlesQueryOptions, feedDetailQueryOptions, feedSubscriptionQueryOptions, postSubscription,
} from '@/api/queries'
import { VerticalCard } from '@/components/common/article-card'
import { EmptyState } from '@/components/feedback/empty-state'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import { type ContentType, contentTypeLabels, contentTypeOptions } from '@/types/content'
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { produce } from 'immer'
import { ExternalLink } from 'lucide-react'
import { startTransition, useMemo } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

const contentTypeSearchSchema = z.object({
  type: z.enum(contentTypeOptions).optional(),
})

export const Route = createFileRoute('/feed/$id')({
  parseParams: (params) => ({
    id: z.coerce.number().parse(params.id),
  }),
  validateSearch: search => contentTypeSearchSchema.parse(search),
  loader: ({ context: { queryClient, isAuthed }, params: { id } }) => {
    queryClient.ensureQueryData(feedDetailQueryOptions(id))
    isAuthed && queryClient.ensureQueryData(feedSubscriptionQueryOptions(id))
  },
  pendingComponent: FeedDetailSkeleton,
  component: FeedDetail,
})

function FeedDetail() {
  const { ensureAuthed } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate({ from: '/feed/$id' })
  const id = Route.useParams().id
  const { type } = Route.useSearch() as { type?: ContentType }

  const { data: feed } = useSuspenseQuery(feedDetailQueryOptions(id))
  const { data: subscription } = useQuery(feedSubscriptionQueryOptions(id))
  const articlesQuery = useQuery(feedArticlesQueryOptions(id, 0, 50, type))
  const articles = articlesQuery.data ?? []
  const isArticleListPending = articlesQuery.isPending && articles.length === 0
  const isArticleListRefreshing = articlesQuery.isFetching && articles.length > 0

  const description = useMemo(() => {
    const trimmed = feed.description?.trim()
    return trimmed || feed.url || '暂无简介'
  }, [feed.description, feed.url])

  const subscriptionMutation = useMutation({
    mutationFn: async (action: 'subscribe' | 'unsubscribe') =>
      action === 'subscribe'
        ? postSubscription({ url: feed.url, title: feed.title })
        : deleteSubscription(id),
    onMutate: async (action) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['feed', id, 'subscription'] }),
        queryClient.cancelQueries({ queryKey: ['feed', id, 'detail'] }),
      ])
      const previousSubscription = queryClient.getQueryData(['feed', id, 'subscription'])
      const previousFeedDetail = queryClient.getQueryData(['feed', id, 'detail'])

      queryClient.setQueryData(
        ['feed', id, 'subscription'],
        produce((draft: typeof subscription) => {
          if (!draft) return
          draft.subscribed = action === 'subscribe'
        }),
      )
      queryClient.setQueryData(
        ['feed', id, 'detail'],
        produce((draft: typeof feed) => {
          if (!draft) return
          const currentCount = draft.subscriberCount ?? 0
          const delta = action === 'subscribe' ? 1 : -1
          draft.subscriberCount = Math.max(0, currentCount + delta)
        }),
      )

      return { previousSubscription, previousFeedDetail }
    },
    onError: (err, _action, onMutateResult) => {
      queryClient.setQueryData(['feed', id, 'subscription'], onMutateResult?.previousSubscription)
      queryClient.setQueryData(['feed', id, 'detail'], onMutateResult?.previousFeedDetail)
      toast.error(err.message || 'Failed to update subscription')
    },
    onSettled: () => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ['feed', id, 'subscription'] }),
        queryClient.invalidateQueries({ queryKey: ['feed', id, 'detail'] }),
        queryClient.invalidateQueries({ queryKey: ['subscription', 'list'] }),
      ])
    },
  })

  const handleSubscribe = () => {
    if (!ensureAuthed()) return
    void subscriptionMutation.mutateAsync('subscribe')
  }

  const handleUnsubscribe = () => {
    if (!ensureAuthed()) return
    void subscriptionMutation.mutateAsync('unsubscribe')
  }

  const subscribed = subscription?.subscribed
  const actionLabel = subscribed ? '取消订阅' : '订阅'
  const subscriberCount = (feed.subscriberCount ?? 0).toLocaleString('zh-CN')
  const articleCount = articles.length.toLocaleString('zh-CN')
  const tabValue = type ?? 'all'

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <div
        className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar className="size-14 ring-1 ring-border/60">
            <AvatarImage src={feed.image ?? undefined} alt={feed.title} />
            <AvatarFallback className="text-sm font-semibold">
              {(feed.title || 'F').slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-1">
            <div className="flex items-center">
              <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">
                {feed.title || '未命名订阅源'}
              </h1>
              <span
                className="ml-2 inline-flex shrink-0 items-center rounded-full border border-border/70 bg-muted/55 px-2.5 py-1 text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
                {contentTypeLabels[feed.contentType]}
              </span>
              {feed.link &&
                <Button size="icon-sm" variant="link" className="rounded-full cursor-pointer"
                        onClick={() => window.open(feed.link!)} aria-label="打开订阅源链接" title="打开订阅源链接">
                  <ExternalLink />
                </Button>}
            </div>
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>
              订阅 <span className="font-semibold text-foreground">{subscriberCount}</span>
            </span>
            <span className="h-3 w-px bg-border/60" />
            <span>
              内容 <span className="font-semibold text-foreground">{articleCount}</span>
            </span>
          </div>
          <Button
            variant={subscribed ? 'outline' : 'default'}
            className={cn('w-24 cursor-pointer', subscribed && 'border-border/70 bg-card ')}
            onClick={subscribed ? handleUnsubscribe : handleSubscribe}
          >
            {actionLabel}
          </Button>
        </div>
      </div>

      <Tabs
        value={tabValue}
        onValueChange={(value) => {
          startTransition(() => {
            void navigate({
              search: () => (value === 'all' ? {} : { type: value as ContentType }),
              replace: true,
            })
          })
        }}
        className="gap-4"
      >
        <TabsList>
          <TabsTrigger value="all" className="flex-none px-4">全部</TabsTrigger>
          {contentTypeOptions.map((contentType) => (
            <TabsTrigger key={contentType} value={contentType} className="flex-none px-4">
              {contentTypeLabels[contentType]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isArticleListPending || isArticleListRefreshing ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <FeedArticleSkeleton key={index} />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="mx-auto w-full max-w-3xl">
          <EmptyState title="暂无内容" description="该订阅源暂时还没有可展示的内容。" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {articles.map((item) => (
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

const FeedHeaderSkeleton = () => (
  <div
    className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
    <div className="flex min-w-0 items-center gap-4">
      <Skeleton className="size-14 rounded-full" />
      <div className="min-w-0 space-y-2">
        <Skeleton className="h-5 w-40 rounded-none" />
        <Skeleton className="h-4 w-64 rounded-none" />
      </div>
    </div>
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-3 w-20 rounded-none" />
        <Skeleton className="h-3 w-16 rounded-none" />
      </div>
      <Skeleton className="h-9 w-24" />
    </div>
  </div>
)

const FeedArticleSkeleton = () => (
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

function FeedDetailSkeleton() {
  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <FeedHeaderSkeleton />
      <Skeleton className="h-9 w-62" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <FeedArticleSkeleton key={index} />
        ))}
      </div>
    </section>
  )
}
