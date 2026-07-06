import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ThemeProvider } from '@/components/theme/ThemeProvider'

export default async function SessionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = process.env.NEXT_PUBLIC_AUTH_LOGIN_URL ?? 'https://auth.leandrosouza.info/login'
    redirect(loginUrl)
  }

  const { data: settings } = await supabase
    .from('gym_user_settings')
    .select('theme')
    .eq('user_id', user.id)
    .maybeSingle()

  const theme = settings?.theme === 'dark' ? 'dark' : 'light'

  return (
    <ThemeProvider initialTheme={theme}>
      {children}
    </ThemeProvider>
  )
}
