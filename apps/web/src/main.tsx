import { routeTree } from '@/routeTree.gen.ts'
import { QueryClient } from '@tanstack/react-query'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { createRoot } from 'react-dom/client'

const queryClient = new QueryClient()

const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultPreloadStaleTime: 0,
  defaultPendingMs: 200,
  defaultPendingMinMs: 300,
})

setupRouterSsrQueryIntegration({ router, queryClient })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const appElement = document.getElementById('app')
if (!appElement) {
  throw new Error('未找到 #app 挂载节点')
}

createRoot(appElement).render(<RouterProvider router={router} />)
