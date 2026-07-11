import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import { ThemeProvider } from '@/components/theme/ThemeProvider'

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [settingsResult, activeSessionResult] = await Promise.all([
    user
      ? supabase
          .from('gym_user_settings')
          .select('theme, weekly_goal')
          .eq('user_id', user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    user
      ? supabase
          .from('gym_workout_sessions')
          .select('id, plan_name_snapshot, performed_at')
          .eq('user_id', user.id)
          .eq('status', 'in_progress')
          .order('performed_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const settings = settingsResult.data
  const activeSession = activeSessionResult.data ?? null
  const theme = settings?.theme === 'dark' ? 'dark' : 'light'

  return (
    <ThemeProvider initialTheme={theme}>
      <AppShell
        userEmail={user?.email}
        weeklyGoal={settings?.weekly_goal ?? 3}
        activeSession={activeSession}
      >
        {children}
      </AppShell>
    </ThemeProvider>
  )
}
