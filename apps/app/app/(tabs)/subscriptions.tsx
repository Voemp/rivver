import { deleteSubscription, postSubscription, subscriptionListQueryOptions } from '@/api/queries'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { CollapsibleHeader, useCollapsibleScroll } from '@/components/layout/collapsible-header'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'
import type { Subscription } from '@/types/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { Plus, X } from 'lucide-react-native'
import { useState } from 'react'
import { Alert, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, RefreshControl, View } from 'react-native'

export default function SubscriptionsScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const query = useQuery(subscriptionListQueryOptions())
  const items = (query.data ?? []) as Subscription[]
  const { scrollY, onScroll } = useCollapsibleScroll()

  const [modalVisible, setModalVisible] = useState(false)
  const [url, setUrl] = useState('')

  const subscribeMutation = useMutation({
    mutationFn: (payload: { url: string }) => postSubscription(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['subscription', 'list'] })
      setModalVisible(false)
      setUrl('')
    },
    onError: (err: Error) => Alert.alert('订阅失败', err.message),
  })

  const unsubscribeMutation = useMutation({
    mutationFn: deleteSubscription,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['subscription', 'list'] }),
    onError: (err: Error) => Alert.alert('取消订阅失败', err.message),
  })

  const handleAdd = () => {
    const trimmed = url.trim()
    if (!trimmed) {
      Alert.alert('提示', '请输入 RSS 订阅地址')
      return
    }
    subscribeMutation.mutate({ url: trimmed })
  }

  const handleUnsubscribe = (feedId: number, feedTitle: string) => {
    Alert.alert('取消订阅', `确定取消订阅「${feedTitle}」吗？`, [
      { text: '取消', style: 'cancel' },
      { text: '确定', style: 'destructive', onPress: () => unsubscribeMutation.mutate(feedId) },
    ])
  }

  if (query.isPending) {
    return (
      <View className="flex-1 bg-background">
        <CollapsibleHeader title="我的订阅" subtitle="Subscriptions" scrollY={scrollY} />
        <View className="gap-3 px-4 pt-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </View>
      </View>
    )
  }

  if (query.isError) {
    return (
      <View className="flex-1 bg-background">
        <CollapsibleHeader title="我的订阅" subtitle="Subscriptions" scrollY={scrollY} />
        <ErrorState onRetry={() => void query.refetch()} />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-background">
      <CollapsibleHeader
        title="我的订阅"
        subtitle="Subscriptions"
        scrollY={scrollY}
        rightAction={
          <Button variant="default" size="sm" onPress={() => setModalVisible(true)}>
            <Plus size={16} color="#fafafa" />
            <Text className="ml-1 text-sm text-primary-foreground" style={{ fontWeight: '500' }}>添加</Text>
          </Button>
        }
      />
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerClassName="px-4 pb-6 pt-3"
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => void query.refetch()} />}
        renderItem={({ item }) => (
          <Pressable
            className="mb-2 flex-row items-center gap-3 rounded-xl border border-border/60 bg-card p-3"
            onPress={() => router.push(`/feed/${item.feedId ?? item.id}` as any)}
          >
            <Avatar src={item.image ?? item.feed?.image} fallback={item.title ?? item.feed?.title ?? 'F'} size={40} />
            <View className="flex-1">
              <Text className="text-sm text-foreground" style={{ fontWeight: '600' }} numberOfLines={1}>
                {item.customTitle || item.title || item.feed?.title || '未命名'}
              </Text>
              <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                {item.description || item.feed?.description || item.url || item.feed?.url || ''}
              </Text>
            </View>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => handleUnsubscribe(item.feedId ?? item.id, item.title || item.feed?.title || '')}
            >
              <Text className="text-xs text-destructive">取消</Text>
            </Button>
          </Pressable>
        )}
        ListEmptyComponent={<EmptyState title="暂无订阅" description="点击右上角添加 RSS 订阅源。" />}
      />

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <Pressable className="flex-1 bg-black/40" onPress={() => setModalVisible(false)} />
          <View className="rounded-t-3xl bg-background px-6 pb-10 pt-4">
            <View className="mb-6 flex-row items-center justify-between">
              <Text className="text-xl text-foreground" style={{ fontWeight: '700' }}>添加订阅</Text>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={12}>
                <X size={22} color="hsl(0, 0%, 45.1%)" />
              </Pressable>
            </View>
            <Text className="mb-1.5 text-sm text-foreground" style={{ fontWeight: '500' }}>RSS 地址</Text>
            <Input
              placeholder="https://example.com/feed.xml"
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              keyboardType="url"
              autoCorrect={false}
            />
            <Button className="mt-4" onPress={handleAdd} loading={subscribeMutation.isPending}>
              <Text className="text-sm text-primary-foreground" style={{ fontWeight: '500' }}>订阅</Text>
            </Button>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}
