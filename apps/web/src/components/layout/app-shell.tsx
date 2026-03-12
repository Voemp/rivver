import { AppFooter } from '@/components/layout/app-footer'
import { AppHeader } from '@/components/layout/app-header'
import { type ReactNode } from 'react'

type AppShellProps = {
  children: ReactNode
}

export const AppShell = ({ children }: AppShellProps) => {
  const backgroundStyle = {
    background: 'radial-gradient(circle_at_top,rgba(15,23,42,0.06),transparent_45%),var(--background)',
  }

  return (
    <div className="flex min-h-dvh flex-col" style={backgroundStyle}>
      <AppHeader />
      <main className="mx-auto w-full max-w-420 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      <AppFooter />
    </div>
  )
}
