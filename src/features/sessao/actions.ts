'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { WeightType } from '@/types/database'

export async function startSession(planId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: plan } = await supabase
    .from('gym_workout_plans')
    .select('id, name')
    .eq('id', planId)
    .eq('user_id', user.id)
    .single()

  if (!plan) return

  const { data: exercises } = await supabase
    .from('gym_workout_exercises')
    .select('*')
    .eq('workout_plan_id', planId)
    .order('display_order', { ascending: true })

  const { data: session, error } = await supabase
    .from('gym_workout_sessions')
    .insert({
      user_id: user.id,
      workout_plan_id: planId,
      plan_name_snapshot: plan.name,
      status: 'in_progress',
      performed_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error || !session) return

  if (exercises && exercises.length > 0) {
    const sessionExercises = await supabase
      .from('gym_session_exercises')
      .insert(
        exercises.map((ex, idx) => ({
          session_id: session.id,
          plan_exercise_id: ex.id,
          exercise_name: ex.exercise_name,
          weight_type: ex.weight_type,
          weight_per_side: ex.weight_per_side,
          display_order: idx,
        }))
      )
      .select('id, plan_exercise_id, exercise_name')

    if (sessionExercises.data) {
      const setsToInsert = sessionExercises.data.flatMap((se, seIdx) => {
        const planEx = exercises.find((e) => e.id === se.plan_exercise_id)
        const setCount = planEx?.sets ?? 3
        return Array.from({ length: setCount }, (_, i) => ({
          session_exercise_id: se.id,
          set_number: i + 1,
          set_type: 'normal' as const,
          weight_value: planEx?.target_weight ?? null,
          reps: planEx?.reps ?? null,
          completed_at: null,
        }))
      })

      if (setsToInsert.length > 0) {
        await supabase.from('gym_session_sets').insert(setsToInsert)
      }
    }
  }

  redirect(`/sessao/${session.id}`)
}

export async function logSet(
  setId: string,
  weightValue: number | null,
  reps: number | null
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('gym_session_sets')
    .update({
      weight_value: weightValue,
      reps,
      completed_at: new Date().toISOString(),
    })
    .eq('id', setId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function uncompleteSet(setId: string) {
  const supabase = await createClient()
  await supabase
    .from('gym_session_sets')
    .update({ completed_at: null })
    .eq('id', setId)
  return { success: true }
}

export async function addSet(sessionExerciseId: string) {
  const supabase = await createClient()

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
      weight_value: last?.weight_value ?? null,
      reps: last?.reps ?? null,
      completed_at: null,
    })
    .select('id, session_exercise_id, set_number, set_type, weight_value, reps, completed_at, notes')
    .single()

  if (error) return { error: error.message }
  return { data }
}

export async function removeLastSet(sessionExerciseId: string) {
  const supabase = await createClient()

  const { data: last } = await supabase
    .from('gym_session_sets')
    .select('id, completed_at')
    .eq('session_exercise_id', sessionExerciseId)
    .order('set_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!last || last.completed_at) return { error: 'Não é possível remover série concluída' }

  await supabase.from('gym_session_sets').delete().eq('id', last.id)
  return { success: true }
}

export async function finishSession(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('gym_workout_sessions')
    .update({
      status: 'completed',
      ended_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .eq('user_id', user.id)

  revalidatePath('/dashboard')
  revalidatePath('/historico')
  redirect('/dashboard')
}

export async function cancelSession(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('gym_workout_sessions')
    .update({ status: 'cancelled', ended_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('user_id', user.id)

  redirect('/treinos')
}

export async function checkAndUpdatePr(
  userId: string,
  exerciseName: string,
  weightValue: number,
  reps: number,
  weightType: string
) {
  if (weightType !== 'kg') return { isNewPr: false }

  const supabase = await createClient()

  const volume = weightValue * reps

  const { data: existing } = await supabase
    .from('gym_exercise_prs')
    .select('id, max_weight, max_volume')
    .eq('user_id', userId)
    .eq('exercise_name', exerciseName)
    .maybeSingle()

  const isWeightPr = !existing || (existing.max_weight === null || weightValue > existing.max_weight)
  const isVolumePr = !existing || (existing.max_volume === null || volume > existing.max_volume)

  if (isWeightPr || isVolumePr) {
    await supabase
      .from('gym_exercise_prs')
      .upsert({
        user_id: userId,
        exercise_name: exerciseName,
        max_weight: isWeightPr ? weightValue : existing?.max_weight,
        max_volume: isVolumePr ? volume : existing?.max_volume,
        achieved_at: new Date().toISOString(),
      })
  }

  return { isNewPr: isWeightPr || isVolumePr, isWeightPr, isVolumePr }
}

export async function addExerciseToSession(
  sessionId: string,
  exerciseName: string,
  weightType: WeightType,
  weightPerSide: boolean,
  setsCount: number = 3,
  targetWeight: number | null = null,
  targetReps: number | null = null
): Promise<{ exercise?: Record<string, unknown>; sets?: Record<string, unknown>[]; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: session } = await supabase
    .from('gym_workout_sessions')
    .select('id, status')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!session) return { error: 'Sessão não encontrada' }
  if (session.status !== 'in_progress') return { error: 'Sessão não está em andamento' }

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
      Array.from({ length: setsCount }, (_, i) => ({
        session_exercise_id: exercise.id,
        set_number: i + 1,
        set_type: 'normal' as const,
        weight_value: targetWeight,
        reps: targetReps,
        completed_at: null,
      }))
    )
    .select('*')

  if (setsError) return { error: setsError.message }

  revalidatePath(`/sessao/${sessionId}`)
  return {
    exercise: exercise as Record<string, unknown>,
    sets: (sets ?? []) as Record<string, unknown>[],
  }
}

export async function deleteSession(sessionId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('gym_workout_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', user.id)

  revalidatePath('/historico')
  revalidatePath('/dashboard')
  redirect('/historico')
}
