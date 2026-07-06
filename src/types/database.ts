// ---------------------------------------------------------------------------
// Planos e exercícios
// ---------------------------------------------------------------------------

export type WeightType = 'kg' | 'plates'

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
  weight_type: WeightType
  weight_per_side: boolean
  rest_seconds: number | null
  notes: string | null
  display_order: number
}

// ---------------------------------------------------------------------------
// Sessões
// ---------------------------------------------------------------------------

export type SessionStatus = 'in_progress' | 'completed' | 'cancelled'

export type GymWorkoutSession = {
  id: string
  user_id: string
  workout_plan_id: string | null
  performed_at: string
  ended_at: string | null
  status: SessionStatus
  plan_name_snapshot: string | null
  notes: string | null
}

export type GymSessionExercise = {
  id: string
  session_id: string
  plan_exercise_id: string | null
  exercise_name: string
  weight_type: WeightType
  weight_per_side: boolean
  display_order: number
  notes: string | null
}

export type SetType = 'warmup' | 'normal' | 'dropset' | 'failure'

export type GymSessionSet = {
  id: string
  session_exercise_id: string
  set_number: number
  set_type: SetType
  weight_value: number | null
  reps: number | null
  completed_at: string | null
  notes: string | null
}

// ---------------------------------------------------------------------------
// PRs e configurações
// ---------------------------------------------------------------------------

export type GymExercisePr = {
  id: string
  user_id: string
  exercise_name: string
  max_weight: number | null
  max_volume: number | null
  achieved_at: string
}

export type GymUserSettings = {
  user_id: string
  weekly_goal: number
  theme: 'light' | 'dark'
  updated_at: string
}

// ---------------------------------------------------------------------------
// Insert / Update helpers
// ---------------------------------------------------------------------------

export type GymWorkoutPlanInsert = Omit<GymWorkoutPlan, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
}

export type GymWorkoutPlanUpdate = Partial<Omit<GymWorkoutPlan, 'id' | 'user_id' | 'created_at'>>

export type GymWorkoutExerciseInsert = Omit<GymWorkoutExercise, 'id'> & { id?: string }

export type GymWorkoutExerciseUpdate = Partial<Omit<GymWorkoutExercise, 'id' | 'workout_plan_id'>>

export type GymWorkoutSessionInsert = Omit<GymWorkoutSession, 'id'> & { id?: string }

export type GymWorkoutSessionUpdate = Partial<Omit<GymWorkoutSession, 'id' | 'user_id'>>

export type GymSessionExerciseInsert = Omit<GymSessionExercise, 'id'> & { id?: string }

export type GymSessionSetInsert = Omit<GymSessionSet, 'id'> & { id?: string }

export type GymSessionSetUpdate = Partial<Omit<GymSessionSet, 'id' | 'session_exercise_id'>>

export type GymExercisePrInsert = Omit<GymExercisePr, 'id'> & { id?: string }

export type GymExercisePrUpdate = Partial<Omit<GymExercisePr, 'id' | 'user_id'>>

export type GymUserSettingsInsert = Omit<GymUserSettings, 'updated_at'> & { updated_at?: string }

// ---------------------------------------------------------------------------
// Legado (mantido para compatibilidade com migration 001)
// ---------------------------------------------------------------------------

export type GymExerciseLog = {
  id: string
  workout_session_id: string
  workout_exercise_id: string | null
  weight_used: number | null
  reps_completed: number | null
  notes: string | null
}
