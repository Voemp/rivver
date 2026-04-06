import { ErrorState } from '@/components/feedback/error-state.tsx'
import { NotFoundState } from '@/components/feedback/not-found-state.tsx'
import { AppShell } from '@/components/layout/app-shell'
import { Toaster } from '@/components/ui/sonner.tsx'
import { AuthProvider, sessionQueryOptions } from '@/hooks/use-auth.tsx'
import { TanStackDevtools } from '@tanstack/react-devtools'
import type { QueryClient } from '@tanstack/react-query'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

type RouterContext = {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async ({ context: { queryClient } }) => {
    const session = await queryClient.ensureQueryData(sessionQueryOptions)
    return {
      isAuthed: !!session?.user,
    }
  },
  component: RootComponent,
  notFoundComponent: () => NotFoundState,
  errorComponent: ErrorState,
})

function RootComponent() {
  return (
    <>
      <AuthProvider>
        <AppShell>
          <Outlet />
        </AppShell>
        <Toaster richColors toastOptions={{ className: 'border border-border bg-card text-card-foreground' }} />
      </AuthProvider>
      {import.meta.env.DEV ? (
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[
            {
              name: 'TanStack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            {
              name: 'Tanstack Query',
              render: <ReactQueryDevtoolsPanel />,
            },
          ]}
        />
      ) : null}
    </>
  )
}
