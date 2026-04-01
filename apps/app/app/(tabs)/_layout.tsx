import { useAuth } from '@/hooks/use-auth'
import { Tabs } from 'expo-router'
import { Heart, Home, Rss, User } from 'lucide-react-native'

export default function TabLayout() {
  const { isAuthed } = useAuth()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0a0a0a',
        tabBarInactiveTintColor: '#a3a3a3',
        tabBarStyle: {
          borderTopColor: '#e5e5e5',
          backgroundColor: '#ffffff',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: '收藏',
          tabBarIcon: ({ color, size }) => <Heart size={size} color={color} />,
          href: isAuthed ? '/favorites' : null,
        }}
      />
      <Tabs.Screen
        name="subscriptions"
        options={{
          title: '订阅',
          tabBarIcon: ({ color, size }) => <Rss size={size} color={color} />,
          href: isAuthed ? '/subscriptions' : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  )
}
