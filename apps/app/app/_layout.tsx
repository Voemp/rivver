import '../global.css'
import { AuthModal } from '@/components/auth/auth-modal'
import { AuthProvider } from '@/hooks/use-auth'
import { PortalHost } from '@rn-primitives/portal'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useState } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { retry: 1, staleTime: 1000 * 60 * 5 },
    },
  }))

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="article/[id]"
              options={{ headerShown: false, animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="feed/[id]"
              options={{ headerShown: false, animation: 'slide_from_right' }}
            />
          </Stack>
          <PortalHost />
          <AuthModal />
          <StatusBar style="dark" />
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  )
}
