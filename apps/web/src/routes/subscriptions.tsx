import type { appClient } from '@/api/client.ts'
import { deleteSubscription, postSubscription, subscriptionListQueryOptions } from '@/api/queries'
import { FeedInfoCard, FeedInfoSkeleton } from '@/components/feed/feed-info-card'
import { EmptyState } from '@/components/feedback/empty-state'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldContent, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import type { Treaty } from '@elysiajs/eden'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useDebounceFn } from 'ahooks'
import { produce } from 'immer'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

export const Route = createFileRoute('/subscriptions')({
  loader: ({ context }) => context.queryClient.ensureQueryData(subscriptionListQueryOptions()),
  pendingComponent: SubscriptionsSkeleton,
  component: Subscriptions,
})

type SubscriptionItem = Treaty.Data<typeof appClient.subscription.get>[number]

type SubscriptionAction = {
  feed: SubscriptionItem
  action: 'subscribe' | 'unsubscribe'
}

const updateSubscriberCount = (count: number | null, delta: number) => Math.max(0, (count ?? 0) + delta)
const normalizeUrl = (value: string) => value.replace(/\/+$/, '')
const subscriptionSchema = z.object({
  url: z.url('请输入有效的订阅链接')
    .trim()
    .min(1, '请输入订阅链接')
    .transform((value) => normalizeUrl(value)),
  title: z.string().trim().optional(),
})

type SubscriptionFormValues = z.infer<typeof subscriptionSchema>

function Subscriptions() {
  const { ensureAuthed } = useAuth()
  const queryClient = useQueryClient()
  const subscriptionsQuery = useSuspenseQuery(subscriptionListQueryOptions())
  const [originalSubscribed, setOriginalSubscribed] = useState<Record<number, boolean>>(
    subscriptionsQuery.data.reduce(
      (acc, item) => {
        acc[item.id] = true
        return acc
      },
      {} as Record<number, boolean>,
    ),
  )
  const [optimisticSubscribed, setOptimisticSubscribed] = useState<Record<number, boolean>>({})
  const [dialogOpen, setDialogOpen] = useState(false)
  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      url: '',
      title: '',
    },
  })

  const addMutation = useMutation({
    mutationFn: (payload: { url: string; title?: string | null }) => postSubscription(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['subscription', 'list'] })
      toast.success('订阅成功')
      setDialogOpen(false)
      form.reset()
    },
    onError: (error: Error) => toast.error(error.message || '订阅失败'),
  })

  const subscriptionMutation = useMutation({
    mutationFn: async ({ feed, action }: SubscriptionAction) =>
      action === 'subscribe'
        ? postSubscription({ url: feed.url, title: feed.title })
        : deleteSubscription(feed.id),
    onError: (error) => {
      toast.error(error.message || '操作失败')
      void queryClient.invalidateQueries({ queryKey: ['subscription', 'list'] })
    },
    onSettled: async (_data, _error, variables) => {
      setOriginalSubscribed(produce(originalSubscribed, (draft) => {
        draft[variables.feed.id] = variables.action === 'subscribe'
      }))
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ['feed', variables.feed.id, 'subscription'] }),
        queryClient.invalidateQueries({ queryKey: ['feed', variables.feed.id, 'detail'] }),
      ])
    },
  })

  const { run: debouncedSubscriptionMutate } = useDebounceFn(
    (feed: SubscriptionItem, finalAction: 'subscribe' | 'unsubscribe') => {
      // 获取订阅的原始状态
      const isOriginalSubscribed = originalSubscribed[feed.id]
      const isFinallySubscribed = finalAction === 'subscribe'

      // 如果最终意图和初始状态一样，则跳过请求
      if (isOriginalSubscribed === isFinallySubscribed) return

      // 否则，发送请求
      subscriptionMutation.mutate({ feed, action: finalAction })
    },
    { wait: 500 },
  )

  const handleSubscribeToggle = (feed: SubscriptionItem, action: 'subscribe' | 'unsubscribe') => {
    if (!ensureAuthed()) return

    // 乐观更新本地 UI 状态
    const nextSubscribed = action === 'subscribe'
    setOptimisticSubscribed(prev => ({ ...prev, [feed.id]: nextSubscribed }))

    // 乐观更新 QueryCache 中的数字
    queryClient.setQueryData(['subscription', 'list'], (old: SubscriptionItem[] | undefined) => {
      if (!old) return old
      return produce(old, (draft) => {
        const item = draft.find((i) => i.id === feed.id)
        if (item) {
          // 判断当前 UI 状态相对于原始状态的位移
          const delta = action === 'subscribe' ? 1 : -1
          item.subscriberCount = updateSubscriberCount(item.subscriberCount, delta)
        }
      })
    })

    // 触发防抖逻辑
    debouncedSubscriptionMutate(feed, action)
  }

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      form.reset()
    }
  }

  const handleSubmit = (values: SubscriptionFormValues) => {
    if (!ensureAuthed()) return
    const title = values.title?.trim()
    void addMutation.mutateAsync({ url: values.url, title: title || undefined })
  }

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Subscriptions</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">全部订阅</h1>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" />
          添加订阅
        </Button>
      </div>

      {subscriptionsQuery.data.length === 0 ? (
        <EmptyState
          title="暂无订阅"
          description="添加你关注的订阅源，最新内容会第一时间推送给你。"
          action={(
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" />
              添加订阅
            </Button>
          )}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {subscriptionsQuery.data.map((item) => {
            const isSubscribed = optimisticSubscribed[item.id] ?? true

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-border/60 bg-card/80 px-4 pt-4"
              >
                <FeedInfoCard
                  feed={item}
                  subscribed={isSubscribed}
                  linkToFeed
                  onSubscribe={() => {
                    if (!ensureAuthed()) return
                    handleSubscribeToggle(item, 'subscribe')
                  }}
                  onUnsubscribe={() => {
                    if (!ensureAuthed()) return
                    handleSubscribeToggle(item, 'unsubscribe')
                  }}
                />
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加订阅</DialogTitle>
            <DialogDescription>粘贴订阅源地址，系统会自动解析内容。</DialogDescription>
          </DialogHeader>

          <form
            className="grid gap-4"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <Field>
              <FieldLabel htmlFor="subscription-url">订阅地址</FieldLabel>
              <FieldContent>
                <Input
                  id="subscription-url"
                  placeholder="https://example.com/rss"
                  aria-invalid={!!form.formState.errors.url}
                  {...form.register('url')}
                />
                <FieldError
                  className="text-xs"
                  errors={form.formState.errors.url ? [form.formState.errors.url] : []}
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="subscription-title">订阅名称（可选）</FieldLabel>
              <FieldContent>
                <Input
                  id="subscription-title"
                  placeholder="例如：产品更新"
                  {...form.register('title')}
                />
              </FieldContent>
            </Field>

            <DialogFooter className="mt-2">
              <Button type="button" variant="outline" onClick={() => handleDialogChange(false)}>
                取消
              </Button>
              <Button type="submit" disabled={addMutation.isPending}>
                {addMutation.isPending ? '添加中...' : '添加订阅'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  )
}

function SubscriptionsSkeleton() {
  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24 rounded-none" />
          <Skeleton className="h-7 w-28 rounded-none" />
        </div>
        <Skeleton className="h-9 w-28 rounded-full" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-border/50 bg-card/70 px-4 pt-4"
          >
            <FeedInfoSkeleton />
          </div>
        ))}
      </div>
    </section>
  )
}
