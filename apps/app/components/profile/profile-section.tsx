import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Text } from '@/components/ui/text'
import { env } from '@/config/env'
import { useAuth } from '@/hooks/use-auth'
import { ChevronRight, LogOut, User } from 'lucide-react-native'
import { Alert, Pressable, View } from 'react-native'

export const ProfileSection = () => {
  const { session, isAuthed, openAuthModal, signOut } = useAuth()

  const handleSignOut = () => {
    Alert.alert('退出登录', '确定要退出登录吗？', [
      { text: '取消', style: 'cancel' },
      { text: '确定', style: 'destructive', onPress: () => void signOut() },
    ])
  }

  if (!isAuthed || !session) {
    return (
      <View className="items-center gap-4 py-8">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-muted">
          <User size={36} color="hsl(0, 0%, 45.1%)" />
        </View>
        <Text className="text-base text-muted-foreground">登录以获取个性化推荐</Text>
        <Button onPress={() => openAuthModal('sign-in')} className="w-40">
          <Text>登录</Text>
        </Button>
      </View>
    )
  }

  const user = session.user
  const avatarUrl = user.image || `${env.apiBaseUrl}/profile/avatar?v=${Date.now()}`

  return (
    <View className="gap-4">
      <View className="items-center gap-3 py-4">
        <Avatar src={avatarUrl} fallback={user.name ?? user.email} size={72} />
        <View className="items-center">
          <Text className="text-lg text-foreground" style={{ fontWeight: '600' }}>{user.name || '用户'}</Text>
          <Text className="text-sm text-muted-foreground">{user.email}</Text>
        </View>
      </View>

      <Separator />

      <Pressable className="flex-row items-center justify-between py-3" onPress={handleSignOut}>
        <View className="flex-row items-center gap-3">
          <LogOut size={20} color="hsl(0, 84.2%, 60.2%)" />
          <Text className="text-base text-destructive">退出登录</Text>
        </View>
        <ChevronRight size={18} color="hsl(0, 0%, 45.1%)" />
      </Pressable>
    </View>
  )
}
