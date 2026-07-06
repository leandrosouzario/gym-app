import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import { ThemeProvider } from '@/components/theme/ThemeProvider'

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: settings } = user
    ? await supabase
        .from('gym_user_settings')
        .select('theme, weekly_goal')
        .eq('user_id', user.id)
        .maybeSingle()
    : { data: null }

  const theme = settings?.theme === 'dark' ? 'dark' : 'light'

  return (
    <ThemeProvider initialTheme={theme}>
      <AppShell userEmail={user?.email} weeklyGoal={settings?.weekly_goal ?? 3}>
        {children}
      </AppShell>
    </ThemeProvider>
  )
}
