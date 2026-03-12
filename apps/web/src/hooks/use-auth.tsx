import { authClient } from '@/api/auth-client'
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, type ReactNode, useContext, useMemo, useState } from 'react'

type AuthDialogMode = 'sign-in' | 'sign-up'

type SessionPayload = Awaited<ReturnType<typeof authClient.getSession>>['data']

export type AuthContextValue = {
  session: SessionPayload | null
  isAuthed: boolean
  isPending: boolean
  authDialogOpen: boolean
  authDialogMode: AuthDialogMode
  openAuthDialog: (mode?: AuthDialogMode) => void
  closeAuthDialog: () => void
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

type AuthProviderProps = {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const queryClient = useQueryClient()
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [authDialogMode, setAuthDialogMode] = useState<AuthDialogMode>('sign-in')

  const sessionQuery = useQuery(sessionQueryOptions)

  const signOutMutation = useMutation({
    mutationFn: async () => {
      const response = await authClient.signOut()
      if (response.error) {
        throw new Error(response.error.message || '退出登录失败')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.clear()
    },
  })

  const value = useMemo<AuthContextValue>(
    () => ({
      session: sessionQuery.data ?? null,
      isAuthed: !!sessionQuery.data,
      isPending: sessionQuery.isPending,
      authDialogOpen,
      authDialogMode,
      openAuthDialog: (mode = 'sign-in') => {
        setAuthDialogMode(mode)
        setAuthDialogOpen(true)
      },
      closeAuthDialog: () => setAuthDialogOpen(false),
      signOut: async () => {
        await signOutMutation.mutateAsync()
      },
      refreshSession: async () => {
        await sessionQuery.refetch()
      },
      ensureAuthed: () => {
        if (sessionQuery.data) {
          return true
        }
        setAuthDialogMode('sign-in')
        setAuthDialogOpen(true)
        return false
      },
    }),
    [authDialogMode, authDialogOpen, sessionQuery, signOutMutation],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
