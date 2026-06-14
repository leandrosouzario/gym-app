export type GymWorkoutPlan = {
  id: string
  user_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export type GymWorkoutExercise = {
  id: string
  workout_plan_id: string
  exercise_name: string
  sets: number
  reps: number
  target_weight: number | null
  notes: string | null
  display_order: number
}

export type GymWorkoutSession = {
  id: string
  user_id: string
  workout_plan_id: string
  performed_at: string
  notes: string | null
}

export type GymExerciseLog = {
  id: string
  workout_session_id: string
  workout_exercise_id: string
  weight_used: number | null
  reps_completed: number | null
  notes: string | null
}

export type GymExercisePr = {
  id: string
  user_id: string
  exercise_name: string
  max_weight: number | null
  max_volume: number | null
  achieved_at: string
}

export type GymWorkoutPlanInsert = Omit<
  GymWorkoutPlan,
  'id' | 'created_at' | 'updated_at'
> & {
  id?: string
  created_at?: string
  updated_at?: string
}

export type GymWorkoutPlanUpdate = Partial<
  Omit<GymWorkoutPlan, 'id' | 'user_id' | 'created_at'>
>

export type GymWorkoutExerciseInsert = Omit<GymWorkoutExercise, 'id'> & {
  id?: string
}

export type GymWorkoutExerciseUpdate = Partial<
  Omit<GymWorkoutExercise, 'id' | 'workout_plan_id'>
>

export type GymWorkoutSessionInsert = Omit<GymWorkoutSession, 'id'> & {
  id?: string
}

export type GymWorkoutSessionUpdate = Partial<
  Omit<GymWorkoutSession, 'id' | 'user_id'>
>

export type GymExerciseLogInsert = Omit<GymExerciseLog, 'id'> & {
  id?: string
}

export type GymExerciseLogUpdate = Partial<
  Omit<GymExerciseLog, 'id' | 'workout_session_id' | 'workout_exercise_id'>
>

export type GymExercisePrInsert = Omit<GymExercisePr, 'id'> & {
  id?: string
}

export type GymExercisePrUpdate = Partial<
  Omit<GymExercisePr, 'id' | 'user_id'>
>
