'use server'

import { createClient } from '@/lib/supabase/server'
import type { ThemeValue } from '@/lib/theme'

export async function updateTheme(theme: ThemeValue) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('gym_user_settings')
    .upsert({ user_id: user.id, theme, updated_at: new Date().toISOString() })
}
