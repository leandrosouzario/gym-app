'use client'

import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { AppHeader } from './AppHeader'
import { AppSidebar } from './AppSidebar'
import { ActiveSessionBanner } from './ActiveSessionBanner'

type ActiveSession = {
  id: string
  plan_name_snapshot: string | null
  performed_at: string
}

type AppShellProps = {
  children: React.ReactNode
  userEmail?: string | null
  weeklyGoal?: number
  activeSession?: ActiveSession | null
}

export function AppShell({ children, userEmail, weeklyGoal = 3, activeSession }: AppShellProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-950">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          pathname={pathname}
          userEmail={userEmail}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 p-4 md:p-6">
          {activeSession && <ActiveSessionBanner session={activeSession} />}
          {children}
        </main>
      </div>
    </div>
  )
}
