import { authClient } from '@/api/auth-client'
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, type ReactNode, useContext, useMemo, useState } from 'react'

type SessionPayload = Awaited<ReturnType<typeof authClient.getSession>>['data']

export type AuthContextValue = {
  session: SessionPayload | null
  isAuthed: boolean
  isPending: boolean
  authModalVisible: boolean
  authModalMode: 'sign-in' | 'sign-up'
  openAuthModal: (mode?: 'sign-in' | 'sign-up') => void
  closeAuthModal: () => void
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  ensureAuthed: () => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const AUTH_SESSION_QUERY_KEY = ['auth', 'session'] as const

export const sessionQueryOptions = queryOptions({
  queryKey: AUTH_SESSION_QUERY_KEY,
  queryFn: async () => {
    const response = await authClient.getSession()
    return response.data ?? null
  },
})

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient()
  const [authModalVisible, setAuthModalVisible] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'sign-in' | 'sign-up'>('sign-in')

  const sessionQuery = useQuery(sessionQueryOptions)

  const signOutMutation = useMutation({
    mutationFn: async () => {
      const response = await authClient.signOut()
      if (response.error) throw new Error(response.error.message || '退出登录失败')
      return response.data
    },
    onSuccess: () => queryClient.clear(),
  })

  const value = useMemo<AuthContextValue>(
    () => ({
      session: sessionQuery.data ?? null,
      isAuthed: !!sessionQuery.data,
      isPending: sessionQuery.isPending,
      authModalVisible,
      authModalMode,
      openAuthModal: (mode = 'sign-in') => {
        setAuthModalMode(mode)
        setAuthModalVisible(true)
      },
      closeAuthModal: () => setAuthModalVisible(false),
      signOut: () => signOutMutation.mutateAsync().then(() => undefined),
      refreshSession: () => sessionQuery.refetch().then(() => undefined),
      ensureAuthed: () => {
        if (sessionQuery.data) return true
        setAuthModalMode('sign-in')
        setAuthModalVisible(true)
        return false
      },
    }),
    [authModalMode, authModalVisible, sessionQuery, signOutMutation],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
