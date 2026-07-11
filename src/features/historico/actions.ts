'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { WeightType } from '@/types/database'

export async function updateSessionTimestamps(
  sessionId: string,
  performedAt: string,
  endedAt: string | null
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('gym_workout_sessions')
    .update({ performed_at: performedAt, ended_at: endedAt })
    .eq('id', sessionId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/historico/${sessionId}`)
  revalidatePath('/historico')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateSessionSet(
  setId: string,
  sessionId: string,
  weightValue: number | null,
  reps: number | null,
  markCompleted: boolean
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('gym_session_sets')
    .update({
      weight_value: weightValue,
      reps,
      completed_at: markCompleted ? new Date().toISOString() : null,
    })
    .eq('id', setId)

  if (error) return { error: error.message }

  revalidatePath(`/historico/${sessionId}`)
  return { success: true }
}

export async function addSetToSessionExercise(
  sessionExerciseId: string,
  sessionId: string
): Promise<{ data?: Record<string, unknown>; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: last } = await supabase
    .from('gym_session_sets')
    .select('set_number, weight_value, reps')
    .eq('session_exercise_id', sessionExerciseId)
    .order('set_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextSetNumber = (last?.set_number ?? 0) + 1

  const { data, error } = await supabase
    .from('gym_session_sets')
    .insert({
      session_exercise_id: sessionExerciseId,
      set_number: nextSetNumber,
      set_type: 'normal',
      weight_value: null,
      reps: null,
      completed_at: null,
    })
    .select('*')
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/historico/${sessionId}`)
  return { data: data as Record<string, unknown> }
}

export async function removeSessionSet(
  setId: string,
  sessionId: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  await supabase.from('gym_session_sets').delete().eq('id', setId)

  revalidatePath(`/historico/${sessionId}`)
  return { success: true }
}

export async function addExerciseToCompletedSession(
  sessionId: string,
  exerciseName: string,
  weightType: WeightType,
  weightPerSide: boolean
): Promise<{ exercise?: Record<string, unknown>; sets?: Record<string, unknown>[]; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: session } = await supabase
    .from('gym_workout_sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!session) return { error: 'Sessão não encontrada' }

  const { data: lastEx } = await supabase
    .from('gym_session_exercises')
    .select('display_order')
    .eq('session_id', sessionId)
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const displayOrder = (lastEx?.display_order ?? -1) + 1

  const { data: exercise, error: exError } = await supabase
    .from('gym_session_exercises')
    .insert({
      session_id: sessionId,
      plan_exercise_id: null,
      exercise_name: exerciseName,
      weight_type: weightType,
      weight_per_side: weightPerSide,
      display_order: displayOrder,
    })
    .select('*')
    .single()

  if (exError || !exercise) return { error: exError?.message ?? 'Erro ao adicionar exercício' }

  const { data: sets, error: setsError } = await supabase
    .from('gym_session_sets')
    .insert(
      Array.from({ length: 3 }, (_, i) => ({
        session_exercise_id: exercise.id,
        set_number: i + 1,
        set_type: 'normal' as const,
        weight_value: null,
        reps: null,
        completed_at: null,
      }))
    )
    .select('*')

  if (setsError) return { error: setsError.message }

  revalidatePath(`/historico/${sessionId}`)
  return {
    exercise: exercise as Record<string, unknown>,
    sets: (sets ?? []) as Record<string, unknown>[],
  }
}

export async function recalculatePrsForSession(
  sessionId: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: exercises } = await supabase
    .from('gym_session_exercises')
    .select('id, exercise_name, weight_type')
    .eq('session_id', sessionId)

  if (!exercises?.length) return { success: true }

  const kgExercises = exercises.filter((e) => e.weight_type === 'kg')
  if (!kgExercises.length) return { success: true }

  const { data: sets } = await supabase
    .from('gym_session_sets')
    .select('session_exercise_id, weight_value, reps')
    .in('session_exercise_id', kgExercises.map((e) => e.id))
    .not('completed_at', 'is', null)
    .not('weight_value', 'is', null)
    .not('reps', 'is', null)

  if (!sets?.length) return { success: true }

  const byExercise: Record<string, { maxWeight: number; maxVolume: number }> = {}

  for (const set of sets) {
    const ex = kgExercises.find((e) => e.id === set.session_exercise_id)
    if (!ex || !set.weight_value || !set.reps) continue
    const volume = (set.weight_value as number) * (set.reps as number)
    const curr = byExercise[ex.exercise_name] ?? { maxWeight: 0, maxVolume: 0 }
    byExercise[ex.exercise_name] = {
      maxWeight: Math.max(curr.maxWeight, set.weight_value as number),
      maxVolume: Math.max(curr.maxVolume, volume),
    }
  }

  for (const [exerciseName, { maxWeight, maxVolume }] of Object.entries(byExercise)) {
    const { data: existing } = await supabase
      .from('gym_exercise_prs')
      .select('max_weight, max_volume')
      .eq('user_id', user.id)
      .eq('exercise_name', exerciseName)
      .maybeSingle()

    await supabase.from('gym_exercise_prs').upsert({
      user_id: user.id,
      exercise_name: exerciseName,
      max_weight: Math.max(maxWeight, existing?.max_weight ?? 0),
      max_volume: Math.max(maxVolume, existing?.max_volume ?? 0),
      achieved_at: new Date().toISOString(),
    })
  }

  revalidatePath('/evolucao')
  revalidatePath('/dashboard')
  return { success: true }
}
