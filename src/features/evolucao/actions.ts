'use server'

import { createClient } from '@/lib/supabase/server'
import { getExerciseProgress, type ExerciseProgressPoint } from './queries'

export type ExerciseProgressResult = {
  progress: ExerciseProgressPoint[]
  currentPr: number | null
}

export async function fetchExerciseProgress(
  exerciseName: string
): Promise<ExerciseProgressResult | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const [progress, prData] = await Promise.all([
    getExerciseProgress(user.id, exerciseName),
    supabase
      .from('gym_exercise_prs')
      .select('max_weight')
      .eq('user_id', user.id)
      .eq('exercise_name', exerciseName)
      .maybeSingle(),
  ])

  return {
    progress,
    currentPr: prData.data?.max_weight ?? null,
  }
}
