import { createClient } from '@/lib/supabase/server'

export async function getPlans() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('gym_workout_plans')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  return data ?? []
}

export async function getPlanWithExercises(planId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: plan } = await supabase
    .from('gym_workout_plans')
    .select('*')
    .eq('id', planId)
    .eq('user_id', user.id)
    .single()

  if (!plan) return null

  const { data: exercises } = await supabase
    .from('gym_workout_exercises')
    .select('*')
    .eq('workout_plan_id', planId)
    .order('display_order', { ascending: true })

  return { plan, exercises: exercises ?? [] }
}

export async function getExerciseNameSuggestions() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('gym_workout_exercises')
    .select('exercise_name')
    .in(
      'workout_plan_id',
      supabase
        .from('gym_workout_plans')
        .select('id')
        .eq('user_id', user.id) as any
    )

  const names = [...new Set((data ?? []).map((r) => r.exercise_name))].sort()
  return names
}

export async function getPlanLastSession(planId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('gym_workout_sessions')
    .select('id, performed_at, ended_at, status')
    .eq('workout_plan_id', planId)
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('performed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return data
}
