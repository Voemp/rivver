import {
  articleDetailQueryOptions, articleFavoriteQueryOptions, deleteFavorite, deleteSubscription, feedDetailQueryOptions,
  feedSubscriptionQueryOptions, postArticleAiSummary, postArticleClick, postArticleShare, postFavorite,
  postSubscription,
} from '@/api/queries'
import {
  ArticleActionButtons, ArticleActionsSkeleton, type SharePlatform, type SharePlatformItem,
} from '@/components/article/article-action-buttons'
import { ArticleAiSummaryCard } from '@/components/article/article-ai-summary-card'
import { ArticleAudioCard, ArticleAudioSkeleton } from '@/components/article/article-audio-card'
import { ArticleContentCard, ArticleContentSkeleton } from '@/components/article/article-content-card'
import { ArticleMediaDetail } from '@/components/article/article-media-detail'
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
import { Suspense, useEffect } from 'react'
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

type ArticleDetailData = {
  id: number
  feedId: number
  title: string | null
  link: string | null
  contentType: 'article' | 'image' | 'video'
  author: string | null
  pubDate: Date | null
  content: string | null
  aiSummary: string | null
  enclosure: {
    url: string
    type?: string
    length?: number
  } | null
}

type FeedDetailData = {
  id: number
  title: string
  description: string | null
  image: string | null
  url: string
  subscriberCount: number | null
  contentType: 'article' | 'image' | 'video'
}

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
  const isMediaArticle = article.contentType === 'image' || article.contentType === 'video'

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

  const handleSubscribe = () => {
    if (!ensureAuthed()) return
    void subscriptionMutation.mutateAsync('subscribe')
  }

  const handleUnsubscribe = () => {
    void subscriptionMutation.mutateAsync('unsubscribe')
  }

  const handleFavorite = () => {
    if (!ensureAuthed()) return
    void favoriteMutation.mutateAsync()
  }

  const handleShare = (platform: SharePlatform) => {
    if (!ensureAuthed()) return
    void shareMutation.mutateAsync(platform)
  }

  if (isMediaArticle) {
    return (
      <MediaArticleLayout
        article={article}
        feed={feed}
        subscribed={subscription?.subscribed}
        favorited={favorite?.favorited}
        sharePending={shareMutation.isPending}
        onSubscribe={handleSubscribe}
        onUnsubscribe={handleUnsubscribe}
        onFavorite={handleFavorite}
        onShare={handleShare}
      />
    )
  }

  return (
    <StandardArticleLayout
      article={article}
      feed={feed}
      subscribed={subscription?.subscribed}
      favorited={favorite?.favorited}
      sharePending={shareMutation.isPending}
      onSubscribe={handleSubscribe}
      onUnsubscribe={handleUnsubscribe}
      onFavorite={handleFavorite}
      onShare={handleShare}
    />
  )
}

type ArticlePageProps = {
  article: ArticleDetailData
  feed: FeedDetailData
  subscribed: boolean | undefined
  favorited: boolean | undefined
  sharePending: boolean
  onSubscribe: () => void
  onUnsubscribe: () => void
  onFavorite: () => void
  onShare: (platform: SharePlatform) => void
}

function StandardArticleLayout({
                                 article,
                                 feed,
                                 subscribed,
                                 favorited,
                                 sharePending,
                                 onSubscribe,
                                 onUnsubscribe,
                                 onFavorite,
                                 onShare,
                               }: ArticlePageProps) {
  const id = article.id
  const queryClient = useQueryClient()
  const aiSummaryMutation = useMutation({
    mutationFn: async () => postArticleAiSummary(id),
    onSuccess: (result) => {
      queryClient.setQueryData(
        ['article', id, 'detail'],
        (old: typeof article | undefined) => old
          ? {
            ...old,
            aiSummary: result.aiSummary,
          }
          : old,
      )
    },
  })
  const {
    data: aiSummaryResult,
    error: aiSummaryMutationError,
    isError: isAiSummaryError,
    isPending: isAiSummaryPending,
    isSuccess: isAiSummarySuccess,
    mutate: generateAiSummary,
    reset: resetAiSummary,
  } = aiSummaryMutation

  useEffect(() => {
    resetAiSummary()
  }, [id, resetAiSummary])

  useEffect(() => {
    if (article.aiSummary?.trim()) return
    if (isAiSummaryPending || isAiSummarySuccess || isAiSummaryError) return

    generateAiSummary()
  }, [article.aiSummary, generateAiSummary, isAiSummaryError, isAiSummaryPending, isAiSummarySuccess])

  const { progress, headings } = useReadingProgress({ articleId: id })
  const content = article.content ?? ''
  const audioEnclosure = article.enclosure?.type === 'audio/mpeg' ? article.enclosure : null
  const aiSummary = article.aiSummary?.trim() || aiSummaryResult?.aiSummary || null
  const aiSummaryError = aiSummaryMutationError?.message || undefined

  return (
    <section className="relative isolate py-4 pb-16 sm:py-6 lg:py-8">
      <div
        className="mx-auto grid max-w-368 grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,52rem)_18rem] lg:gap-x-8 xl:grid-cols-[20rem_minmax(0,52rem)_18rem] xl:gap-x-10">
        <aside className="hidden xl:block xl:col-start-1">
          <div className="sticky top-30 space-y-6 pr-2">
            <ArticleAiSummaryCard
              summary={aiSummary}
              pending={isAiSummaryPending}
              errorMessage={aiSummaryError}
              onRetry={() => generateAiSummary()}
              layout="aside"
            />
          </div>
        </aside>

        <article className="mx-auto min-w-0 w-full max-w-4xl lg:col-start-2 lg:mx-0">
          <Suspense fallback={<ArticleDetailSkeleton />}>
            <ArticleTitleCard title={article.title} author={article.author} pubDate={article.pubDate} feed={feed} />

            <Separator />

            <div className="mt-8 xl:hidden">
              <ArticleAiSummaryCard
                summary={aiSummary}
                pending={isAiSummaryPending}
                errorMessage={aiSummaryError}
                onRetry={() => generateAiSummary()}
                layout="inline"
              />
            </div>

            {audioEnclosure ? <ArticleAudioCard url={audioEnclosure.url} /> : null}

            <ArticleContentCard content={content} />
          </Suspense>
        </article>

        <aside className="hidden sm:block lg:col-start-3">
          <div className="sticky top-30 max-h-[calc(100dvh-7rem)] space-y-8 overflow-y-auto pl-6 pr-1">
            <Suspense fallback={<FeedInfoSkeleton />}>
              <FeedInfoCard
                feed={feed}
                subscribed={subscribed}
                linkToFeed
                onSubscribe={onSubscribe}
                onUnsubscribe={onUnsubscribe}
              />
            </Suspense>
            <ArticleTocCard progress={progress} headings={headings} />
            <Separator />
            <ArticleActionButtons
              favorited={favorited}
              originalLink={article.link}
              sharePending={sharePending}
              sharePlatforms={sharePlatforms}
              onFavorite={onFavorite}
              onShare={onShare}
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

function MediaArticleLayout({
                              article,
                              feed,
                              subscribed,
                              favorited,
                              sharePending,
                              onSubscribe,
                              onUnsubscribe,
                              onFavorite,
                              onShare,
                            }: ArticlePageProps) {
  return (
    <section className="relative isolate py-4 pb-16 sm:py-6 lg:py-8">
      <div
        className="mx-auto grid max-w-376 grid-cols-1 gap-10 lg:grid-cols-[minmax(0,64rem)_18rem] lg:gap-x-8 xl:grid-cols-[minmax(0,68rem)_18rem] xl:gap-x-10">
        <article className="mx-auto min-w-0 w-full max-w-5xl lg:mx-0">
          <Suspense fallback={<ArticleDetailSkeleton />}>
            <ArticleMediaDetail article={article} feed={feed} />
          </Suspense>
        </article>

        <aside className="hidden sm:block">
          <div className="sticky top-30 max-h-[calc(100dvh-7rem)] space-y-8 overflow-y-auto pl-2 pr-1">
            <Suspense fallback={<FeedInfoSkeleton />}>
              <FeedInfoCard
                feed={feed}
                subscribed={subscribed}
                linkToFeed
                onSubscribe={onSubscribe}
                onUnsubscribe={onUnsubscribe}
              />
            </Suspense>
            <Separator />
            <ArticleActionButtons
              favorited={favorited}
              originalLink={article.link}
              sharePending={sharePending}
              sharePlatforms={sharePlatforms}
              onFavorite={onFavorite}
              onShare={onShare}
              direction="column"
              dropdownSide="left"
              dropdownAlign="center"
              className="pt-2"
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
        className="mx-auto grid max-w-368 grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,52rem)_18rem] lg:gap-x-8 xl:grid-cols-[20rem_minmax(0,52rem)_18rem] xl:gap-x-10">
        <aside className="hidden xl:block xl:col-start-1">
          <div className="sticky top-30 pr-2">
            <ArticleAiSummaryCard summary={null} pending errorMessage={undefined} layout="aside" />
          </div>
        </aside>

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
