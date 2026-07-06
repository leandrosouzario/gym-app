import { createClient } from '@/lib/supabase/server'

export async function getSession(sessionId: string) {
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

  return { session, exercises: exercises ?? [], sets: sets ?? [], userId: user.id }
}

export async function getPreviousSets(planId: string, excludeSessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return {}

  const { data: lastSession } = await supabase
    .from('gym_workout_sessions')
    .select('id')
    .eq('workout_plan_id', planId)
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .neq('id', excludeSessionId)
    .order('performed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!lastSession) return {}

  const { data: exercises } = await supabase
    .from('gym_session_exercises')
    .select('id, exercise_name')
    .eq('session_id', lastSession.id)

  if (!exercises?.length) return {}

  const { data: sets } = await supabase
    .from('gym_session_sets')
    .select('session_exercise_id, set_number, weight_value, reps')
    .in('session_exercise_id', exercises.map((e) => e.id))
    .not('completed_at', 'is', null)
    .order('set_number', { ascending: true })

  const result: Record<string, { weight_value: number | null; reps: number | null }[]> = {}
  for (const ex of exercises) {
    const exSets = (sets ?? []).filter((s) => s.session_exercise_id === ex.id)
    result[ex.exercise_name] = exSets.map((s) => ({
      weight_value: s.weight_value,
      reps: s.reps,
    }))
  }

  return result
}
