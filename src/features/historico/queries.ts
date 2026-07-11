import { createClient } from '@/lib/supabase/server'

export async function getSessions() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('gym_workout_sessions')
    .select('id, plan_name_snapshot, performed_at, ended_at, status, workout_plan_id')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('performed_at', { ascending: false })
    .limit(100)

  return data ?? []
}

export async function getSessionDetail(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: session } = await supabase
    .from('gym_workout_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!session) return null

  const { data: exercises } = await supabase
    .from('gym_session_exercises')
    .select('*')
    .eq('session_id', sessionId)
    .order('display_order', { ascending: true })

  const exerciseIds = (exercises ?? []).map((e) => e.id)

  const { data: sets } = exerciseIds.length > 0
    ? await supabase
        .from('gym_session_sets')
        .select('*')
        .in('session_exercise_id', exerciseIds)
        .order('set_number', { ascending: true })
    : { data: [] }

  return { session, exercises: exercises ?? [], sets: sets ?? [] }
}
