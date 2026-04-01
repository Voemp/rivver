import {
  articleDetailQueryOptions, articleFavoriteQueryOptions, deleteFavorite, deleteSubscription, feedDetailQueryOptions,
  feedSubscriptionQueryOptions, postArticleClick, postArticleShare, postFavorite, postSubscription,
} from '@/api/queries'
import {
  ArticleActionButtons, ArticleActionsSkeleton, type SharePlatform, type SharePlatformItem,
} from '@/components/article/article-action-buttons'
import { ArticleAudioCard, ArticleAudioSkeleton } from '@/components/article/article-audio-card'
import { ArticleContentCard, ArticleContentSkeleton } from '@/components/article/article-content-card'
import { ArticleTitleCard, ArticleTitleSkeleton } from '@/components/article/article-title-card.tsx'
import { ArticleTocCard, ArticleTocSkeleton } from '@/components/article/article-toc-card'
import { FeedInfoCard, FeedInfoSkeleton } from '@/components/feed/feed-info-card'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/use-auth'
import { useMountEffect } from '@/hooks/use-mount-effect'
import { useReadingProgress } from '@/hooks/use-reading-progress'
import { SiSinaweibo, SiTelegram, SiX } from '@icons-pack/react-simple-icons'
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { produce } from 'immer'
import { Link } from 'lucide-react'
import { Suspense } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

export const Route = createFileRoute('/article/$id')({
  parseParams: (params) => ({
    id: z.coerce.number().parse(params.id),
  }),
  loader: async ({ context: { queryClient, isAuthed }, params: { id } }) => {
    const article = await queryClient.ensureQueryData(articleDetailQueryOptions(id))
    await queryClient.ensureQueryData(feedDetailQueryOptions(article.feedId))
    isAuthed && await Promise.all([
      queryClient.ensureQueryData(feedSubscriptionQueryOptions(article.feedId)),
      queryClient.ensureQueryData(articleFavoriteQueryOptions(id)),
    ])
  },
  pendingComponent: ArticleSkeleton,
  component: Article,
})

const sharePlatforms: SharePlatformItem[] = [
  { key: 'copy', label: 'Copy link', icon: Link },
  { key: 'x', label: 'Share to X', icon: SiX },
  { key: 'weibo', label: 'Share to Weibo', icon: SiSinaweibo },
  { key: 'telegram', label: 'Share to Telegram', icon: SiTelegram },
]

const shareToPlatform = async (platform: SharePlatform, url: string): Promise<void> => {
  const encodedUrl = encodeURIComponent(url)
  const windowFeatures = 'noopener,noreferrer'

  switch (platform) {
    case 'copy':
      return navigator.clipboard.writeText(url)
    case 'x':
      window.open(`https://x.com/intent/tweet?url=${encodedUrl}`, '_blank', windowFeatures)
      break
    case 'weibo':
      window.open(`https://service.weibo.com/share/share.php?url=${encodedUrl}`, '_blank', windowFeatures)
      break
    case 'telegram':
      window.open(`https://t.me/share/url?url=${encodedUrl}`, '_blank', windowFeatures)
      break
    default:
      console.warn(`Unknown share platform: ${platform}`)
      break
  }

  return Promise.resolve()
}

function Article() {
  const id = Route.useParams().id
  const { ensureAuthed } = useAuth()
  const queryClient = useQueryClient()

  const { data: article } = useSuspenseQuery(articleDetailQueryOptions(id))
  const { data: feed } = useSuspenseQuery(feedDetailQueryOptions(article.feedId))
  const { data: subscription } = useQuery(feedSubscriptionQueryOptions(article.feedId))
  const { data: favorite } = useQuery(articleFavoriteQueryOptions(id))

  useMountEffect(() => void postArticleClick(id))

  const favoriteMutation = useMutation({
    mutationFn: async () => (favorite?.favorited ? deleteFavorite(id) : postFavorite(id)),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['article', id, 'favorite'] })
      const previousFavorite = queryClient.getQueryData(['article', id, 'favorite'])

      queryClient.setQueryData(['article', id, 'favorite'], (old: any) => ({
        ...old,
        favorited: !old?.favorited,
      }))

      return { previousFavorite }
    },
    onError: (_err, _new, onMutateResult) => {
      queryClient.setQueryData(['article', id, 'favorite'], onMutateResult?.previousFavorite)
      toast.error('Favorite action failed')
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['article', id, 'favorite'] })
    },
  })

  const subscriptionMutation = useMutation({
    mutationFn: async (action: 'subscribe' | 'unsubscribe') =>
      action === 'subscribe'
        ? postSubscription({ url: feed.url, title: feed.title })
        : deleteSubscription(article.feedId),
    onMutate: async (variables) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['feed', article.feedId, 'subscription'] }),
        queryClient.cancelQueries({ queryKey: ['feed', article.feedId, 'detail'] }),
      ])
      const previousSubscription = queryClient.getQueryData(['feed', article.feedId, 'subscription'])
      const previousFeedDetail = queryClient.getQueryData(['feed', article.feedId, 'detail'])

      queryClient.setQueryData(
        ['feed', article.feedId, 'subscription'],
        produce((draft: typeof subscription) => {
          if (!draft) return
          draft.subscribed = !draft.subscribed
        }),
      )
      queryClient.setQueryData(
        ['feed', article.feedId, 'detail'],
        produce((draft: typeof feed) => {
          variables === 'subscribe' ? draft.subscriberCount++ : draft.subscriberCount--
        }),
      )

      return { previousSubscription, previousFeedDetail }
    },
    onError: (err, _new, onMutateResult) => {
      queryClient.setQueryData(['feed', article.feedId, 'subscription'], onMutateResult?.previousSubscription)
      queryClient.setQueryData(['feed', article.feedId, 'detail'], onMutateResult?.previousFeedDetail)
      toast.error(err.message || 'Failed to update subscription')
    },
    onSettled: () => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ['feed', article.feedId, 'subscription'] }),
        queryClient.invalidateQueries({ queryKey: ['feed', article.feedId, 'detail'] }),
        queryClient.invalidateQueries({ queryKey: ['subscription', 'list'] }),
      ])
    },
  })

  const shareMutation = useMutation({
    mutationFn: async (platform: SharePlatform) => {
      await postArticleShare(id)
      await shareToPlatform(platform, window.location.href)
    },
    onSuccess: (_, platform) => {
      toast.success(platform === 'copy' ? 'Link copied' : 'Share window opened')
    },
    onError: (error: Error) => toast.error(error.message || 'Share failed'),
  })

  const { progress, headings } = useReadingProgress({ articleId: id })

  const content = article.content ?? ''
  const audioEnclosure = article.enclosure?.type === 'audio/mpeg' ? article.enclosure : null

  return (
    <section className="relative isolate py-4 pb-16 sm:py-6 lg:py-8">
      <div
        className="mx-auto grid max-w-368 grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,52rem)_18rem] lg:gap-x-10 xl:gap-x-14">
        <article className="mx-auto min-w-0 w-full max-w-4xl lg:col-start-2 lg:mx-0">
          <Suspense fallback={<ArticleDetailSkeleton />}>
            <ArticleTitleCard title={article.title} author={article.author} pubDate={article.pubDate} feed={feed} />

            <Separator />

            {audioEnclosure ? <ArticleAudioCard url={audioEnclosure.url} /> : null}

            <ArticleContentCard content={content} />
          </Suspense>
        </article>

        <aside className="hidden sm:block lg:col-start-3">
          <div className="sticky top-30 max-h-[calc(100dvh-7rem)] space-y-8 overflow-y-auto pl-6 pr-1">
            <Suspense fallback={<FeedInfoSkeleton />}>
              <FeedInfoCard
                feed={feed}
                subscribed={subscription?.subscribed}
                linkToFeed
                onSubscribe={() => {
                  if (!ensureAuthed()) return
                  void subscriptionMutation.mutateAsync('subscribe')
                }}
                onUnsubscribe={() => {
                  void subscriptionMutation.mutateAsync('unsubscribe')
                }}
              />
            </Suspense>
            <ArticleTocCard progress={progress} headings={headings} />
            <Separator />
            <ArticleActionButtons
              favorited={favorite?.favorited}
              sharePending={shareMutation.isPending}
              sharePlatforms={sharePlatforms}
              ensureAuthed={ensureAuthed}
              onFavorite={() => {
                if (!ensureAuthed()) return
                void favoriteMutation.mutateAsync()
              }}
              onShare={(platform) => {
                if (!ensureAuthed()) return
                void shareMutation.mutateAsync(platform)
              }}
              direction="column"
              dropdownSide="left"
              dropdownAlign="center"
              className="pt-6"
            />
          </div>
        </aside>
      </div>
    </section>
  )
}

const ArticleDetailSkeleton = () => (
  <>
    <ArticleTitleSkeleton />
    <Separator />
    <ArticleAudioSkeleton />
    <ArticleContentSkeleton />
  </>
)

function ArticleSkeleton() {
  return (
    <section className="relative isolate py-4 pb-16 sm:py-6 lg:py-8">
      <div
        className="mx-auto grid max-w-368 grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,52rem)_18rem] lg:gap-x-10 xl:gap-x-14">
        <article className="mx-auto min-w-0 w-full max-w-4xl lg:col-start-2 lg:mx-0">
          <ArticleDetailSkeleton />
        </article>

        <aside className="hidden sm:block lg:col-start-3">
          <div className="sticky top-30 max-h-[calc(100dvh-7rem)] space-y-8 overflow-y-auto pl-6 pr-1">
            <FeedInfoSkeleton />
            <ArticleTocSkeleton />
            <Separator />
            <ArticleActionsSkeleton />
          </div>
        </aside>
      </div>
    </section>
  )
}
