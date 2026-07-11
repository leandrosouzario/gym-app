import { createClient } from '@/lib/supabase/server'
import type { WeightType } from '@/types/database'

export type PlanExerciseSuggestion = {
  exercise_name: string
  weight_type: WeightType
  weight_per_side: boolean
  plan_name: string
}

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

export async function getAllPlanExercisesForPicker(): Promise<PlanExerciseSuggestion[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: plans } = await supabase
    .from('gym_workout_plans')
    .select('id, name')
    .eq('user_id', user.id)

  if (!plans?.length) return []

  const { data: exercises } = await supabase
    .from('gym_workout_exercises')
    .select('exercise_name, weight_type, weight_per_side, workout_plan_id')
    .in('workout_plan_id', plans.map((p) => p.id))
    .order('exercise_name', { ascending: true })

  const planMap = new Map(plans.map((p) => [p.id, p.name]))

  return (exercises ?? []).map((ex) => ({
    exercise_name: ex.exercise_name,
    weight_type: ex.weight_type as WeightType,
    weight_per_side: ex.weight_per_side,
    plan_name: planMap.get(ex.workout_plan_id) ?? '',
  }))
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
