import { CollapsibleHeader, useCollapsibleScroll } from '@/components/layout/collapsible-header'
import { ProfileSection } from '@/components/profile/profile-section'
import { Separator } from '@/components/ui/separator'
import { Text } from '@/components/ui/text'
import { env } from '@/config/env'
import { View } from 'react-native'
import Animated from 'react-native-reanimated'

export default function ProfileScreen() {
  const { scrollY, onScroll } = useCollapsibleScroll()

  return (
    <View className="flex-1 bg-background">
      <CollapsibleHeader title="我的" subtitle="Profile" scrollY={scrollY} />
      <Animated.ScrollView
        contentContainerClassName="px-4 pb-10 pt-3"
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <View className="rounded-xl border border-border/60 bg-card p-4">
          <ProfileSection />
        </View>

        <Separator className="my-6" />

        <View className="items-center gap-1">
          <Text className="text-sm text-foreground" style={{ fontWeight: '500' }}>{env.appName}</Text>
          <Text className="text-xs text-muted-foreground">RSS 内容聚合与个性化推荐</Text>
        </View>
      </Animated.ScrollView>
    </View>
  )
}
