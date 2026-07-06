'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { GymWorkoutExerciseInsert, GymWorkoutExerciseUpdate, WeightType } from '@/types/database'

// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------

export async function createPlan(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const name = (formData.get('name') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null

  if (!name) return

  const { data, error } = await supabase
    .from('gym_workout_plans')
    .insert({ user_id: user.id, name, description })
    .select('id')
    .single()

  if (error) return

  revalidatePath('/treinos')
  redirect(`/treinos/${data.id}`)
}

export async function updatePlan(planId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const name = (formData.get('name') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null

  if (!name) return { error: 'Nome obrigatório' }

  const { error } = await supabase
    .from('gym_workout_plans')
    .update({ name, description })
    .eq('id', planId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/treinos/${planId}`)
  revalidatePath('/treinos')
  return { success: true }
}

export async function deletePlan(planId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  await supabase
    .from('gym_workout_plans')
    .delete()
    .eq('id', planId)
    .eq('user_id', user.id)

  revalidatePath('/treinos')
  redirect('/treinos')
}

// ---------------------------------------------------------------------------
// Exercises
// ---------------------------------------------------------------------------

export async function createExercise(planId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: plan } = await supabase
    .from('gym_workout_plans')
    .select('id')
    .eq('id', planId)
    .eq('user_id', user.id)
    .single()

  if (!plan) return { error: 'Ficha não encontrada' }

  const exercise_name = (formData.get('exercise_name') as string)?.trim()
  if (!exercise_name) return { error: 'Nome do exercício obrigatório' }

  const sets = parseInt(formData.get('sets') as string) || 3
  const reps = parseInt(formData.get('reps') as string) || 10
  const target_weight = parseFloat(formData.get('target_weight') as string) || null
  const weight_type = (formData.get('weight_type') as WeightType) || 'kg'
  const weight_per_side = formData.get('weight_per_side') === 'true'
  const notes = (formData.get('notes') as string)?.trim() || null

  const { data: maxOrder } = await supabase
    .from('gym_workout_exercises')
    .select('display_order')
    .eq('workout_plan_id', planId)
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const display_order = (maxOrder?.display_order ?? -1) + 1

  const insert: GymWorkoutExerciseInsert = {
    workout_plan_id: planId,
    exercise_name,
    sets,
    reps,
    target_weight,
    weight_type,
    weight_per_side,
    notes,
    display_order,
  }

  const { error } = await supabase.from('gym_workout_exercises').insert(insert)

  if (error) return { error: error.message }

  revalidatePath(`/treinos/${planId}`)
  return { success: true }
}

export async function updateExercise(exerciseId: string, planId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const update: GymWorkoutExerciseUpdate = {
    exercise_name: (formData.get('exercise_name') as string)?.trim(),
    sets: parseInt(formData.get('sets') as string) || 3,
    reps: parseInt(formData.get('reps') as string) || 10,
    target_weight: parseFloat(formData.get('target_weight') as string) || null,
    weight_type: (formData.get('weight_type') as WeightType) || 'kg',
    weight_per_side: formData.get('weight_per_side') === 'true',
    notes: (formData.get('notes') as string)?.trim() || null,
  }

  const { error } = await supabase
    .from('gym_workout_exercises')
    .update(update)
    .eq('id', exerciseId)

  if (error) return { error: error.message }

  revalidatePath(`/treinos/${planId}`)
  return { success: true }
}

export async function deleteExercise(exerciseId: string, planId: string) {
  const supabase = await createClient()
  await supabase.from('gym_workout_exercises').delete().eq('id', exerciseId)
  revalidatePath(`/treinos/${planId}`)
}

export async function moveExercise(exerciseId: string, planId: string, direction: 'up' | 'down') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: exercises } = await supabase
    .from('gym_workout_exercises')
    .select('id, display_order')
    .eq('workout_plan_id', planId)
    .order('display_order', { ascending: true })

  if (!exercises) return

  const idx = exercises.findIndex((e) => e.id === exerciseId)
  if (idx === -1) return

  const swapIdx = direction === 'up' ? idx - 1 : idx + 1
  if (swapIdx < 0 || swapIdx >= exercises.length) return

  const current = exercises[idx]
  const swap = exercises[swapIdx]

  await supabase
    .from('gym_workout_exercises')
    .update({ display_order: swap.display_order })
    .eq('id', current.id)

  await supabase
    .from('gym_workout_exercises')
    .update({ display_order: current.display_order })
    .eq('id', swap.id)

  revalidatePath(`/treinos/${planId}`)
}
