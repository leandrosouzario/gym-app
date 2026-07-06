import { createClient } from '@/lib/supabase/server'

export type ExerciseProgressPoint = {
  date: string
  sessionId: string
  maxWeight: number | null
  maxReps: number | null
  totalVolume: number
  isPr: boolean
}

export type ExerciseSlotData = {
  exerciseName: string
  progress: ExerciseProgressPoint[]
  currentPr: number | null
}

export type WeekData = {
  weekStart: string
  label: string
  sessionCount: number
}

export type ConsistencyData = {
  weeks: WeekData[]
  currentStreak: number
  recordStreak: number
}

export type PrRecord = {
  exercise_name: string
  max_weight: number | null
  max_volume: number | null
  achieved_at: string
}

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
}

function formatWeekLabel(weekStart: Date): string {
  return weekStart.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}

function calculateStreaks(
  weeks: WeekData[],
  weeklyGoal: number
): { currentStreak: number; recordStreak: number } {
  let recordStreak = 0
  let streak = 0

  for (const week of weeks) {
    if (week.sessionCount >= weeklyGoal) {
      streak++
      recordStreak = Math.max(recordStreak, streak)
    } else {
      streak = 0
    }
  }

  let currentStreak = 0
  for (let i = weeks.length - 1; i >= 0; i--) {
    if (weeks[i].sessionCount >= weeklyGoal) {
      currentStreak++
    } else {
      break
    }
  }

  return { currentStreak, recordStreak }
}

async function getUserId(): Promise<string | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

export async function getExerciseProgress(
  userId: string,
  exerciseName: string
): Promise<ExerciseProgressPoint[]> {
  const supabase = await createClient()

  const { data: sessions } = await supabase
    .from('gym_workout_sessions')
    .select('id, performed_at')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('performed_at', { ascending: true })

  if (!sessions?.length) return []

  const sessionIds = sessions.map((s) => s.id)

  const { data: sessionExercises } = await supabase
    .from('gym_session_exercises')
    .select('id, session_id')
    .in('session_id', sessionIds)
    .eq('exercise_name', exerciseName)

  if (!sessionExercises?.length) return []

  const exerciseIds = sessionExercises.map((e) => e.id)
  const exerciseSessionMap = new Map(sessionExercises.map((e) => [e.id, e.session_id]))

  const { data: sets } = await supabase
    .from('gym_session_sets')
    .select('session_exercise_id, weight_value, reps, completed_at')
    .in('session_exercise_id', exerciseIds)
    .not('completed_at', 'is', null)

  const sessionStats = new Map<
    string,
    { maxWeight: number | null; maxReps: number | null; totalVolume: number }
  >()

  for (const set of sets ?? []) {
    const sessionId = exerciseSessionMap.get(set.session_exercise_id)
    if (!sessionId) continue

    const existing = sessionStats.get(sessionId) ?? {
      maxWeight: null,
      maxReps: null,
      totalVolume: 0,
    }

    const weight = set.weight_value
    const reps = set.reps ?? 0

    if (weight !== null) {
      if (existing.maxWeight === null || weight > existing.maxWeight) {
        existing.maxWeight = weight
        existing.maxReps = reps
      }
      existing.totalVolume += weight * reps
    }

    sessionStats.set(sessionId, existing)
  }

  let runningMax = 0
  const points: ExerciseProgressPoint[] = []

  for (const session of sessions) {
    const stats = sessionStats.get(session.id)
    if (!stats || stats.maxWeight === null) continue

    const isPr = stats.maxWeight > runningMax
    if (isPr) runningMax = stats.maxWeight

    points.push({
      date: session.performed_at,
      sessionId: session.id,
      maxWeight: stats.maxWeight,
      maxReps: stats.maxReps,
      totalVolume: stats.totalVolume,
      isPr,
    })
  }

  return points
}

export async function getRecentExerciseNames(userId: string, limit = 3): Promise<string[]> {
  const supabase = await createClient()

  const { data: sessions } = await supabase
    .from('gym_workout_sessions')
    .select('id, performed_at')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('performed_at', { ascending: false })
    .limit(50)

  if (!sessions?.length) return []

  const sessionDateMap = new Map(sessions.map((s) => [s.id, s.performed_at]))

  const { data: exercises } = await supabase
    .from('gym_session_exercises')
    .select('exercise_name, session_id')
    .in(
      'session_id',
      sessions.map((s) => s.id)
    )

  const exerciseLastDate = new Map<string, string>()

  for (const ex of exercises ?? []) {
    const date = sessionDateMap.get(ex.session_id)
    if (!date) continue
    const existing = exerciseLastDate.get(ex.exercise_name)
    if (!existing || date > existing) {
      exerciseLastDate.set(ex.exercise_name, date)
    }
  }

  return [...exerciseLastDate.entries()]
    .sort((a, b) => b[1].localeCompare(a[1]))
    .slice(0, limit)
    .map(([name]) => name)
}

export async function getAllExerciseNames(userId: string): Promise<string[]> {
  const supabase = await createClient()

  const { data: sessions } = await supabase
    .from('gym_workout_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'completed')

  if (!sessions?.length) return []

  const { data: exercises } = await supabase
    .from('gym_session_exercises')
    .select('exercise_name')
    .in(
      'session_id',
      sessions.map((s) => s.id)
    )

  const names = new Set<string>()
  for (const ex of exercises ?? []) {
    names.add(ex.exercise_name)
  }

  return [...names].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

export async function getRecentExercisesWithProgress(
  userId: string
): Promise<ExerciseSlotData[]> {
  const recentNames = await getRecentExerciseNames(userId, 3)

  const supabase = await createClient()

  const slots = await Promise.all(
    recentNames.map(async (exerciseName) => {
      const [progress, prResult] = await Promise.all([
        getExerciseProgress(userId, exerciseName),
        supabase
          .from('gym_exercise_prs')
          .select('max_weight')
          .eq('user_id', userId)
          .eq('exercise_name', exerciseName)
          .maybeSingle(),
      ])

      return {
        exerciseName,
        progress,
        currentPr: prResult.data?.max_weight ?? null,
      }
    })
  )

  return slots
}

export async function getConsistencyData(
  userId: string,
  weeklyGoal: number
): Promise<ConsistencyData> {
  const supabase = await createClient()

  const now = new Date()
  const sixteenWeeksAgo = new Date(now)
  sixteenWeeksAgo.setDate(now.getDate() - 16 * 7)

  const { data: sessions } = await supabase
    .from('gym_workout_sessions')
    .select('performed_at')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gte('performed_at', sixteenWeeksAgo.toISOString())

  const weekCounts = new Map<string, number>()

  for (const session of sessions ?? []) {
    const weekStart = getWeekStart(new Date(session.performed_at))
    const key = weekStart.toISOString().slice(0, 10)
    weekCounts.set(key, (weekCounts.get(key) ?? 0) + 1)
  }

  const weeks: WeekData[] = []
  const startWeek = getWeekStart(sixteenWeeksAgo)

  for (let i = 0; i < 16; i++) {
    const weekStart = new Date(startWeek)
    weekStart.setDate(startWeek.getDate() + i * 7)
    const key = weekStart.toISOString().slice(0, 10)
    weeks.push({
      weekStart: key,
      label: formatWeekLabel(weekStart),
      sessionCount: weekCounts.get(key) ?? 0,
    })
  }

  const { currentStreak, recordStreak } = calculateStreaks(weeks, weeklyGoal)

  return { weeks, currentStreak, recordStreak }
}

export async function getAllPrs(userId: string): Promise<PrRecord[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('gym_exercise_prs')
    .select('exercise_name, max_weight, max_volume, achieved_at')
    .eq('user_id', userId)
    .order('achieved_at', { ascending: false })

  return data ?? []
}

export async function getEvolucaoData() {
  const userId = await getUserId()
  if (!userId) return null

  const supabase = await createClient()
  const { data: settings } = await supabase
    .from('gym_user_settings')
    .select('weekly_goal')
    .eq('user_id', userId)
    .maybeSingle()

  const weeklyGoal = settings?.weekly_goal ?? 3

  const [defaultSlots, allExerciseNames, consistency, prs] = await Promise.all([
    getRecentExercisesWithProgress(userId),
    getAllExerciseNames(userId),
    getConsistencyData(userId, weeklyGoal),
    getAllPrs(userId),
  ])

  return {
    defaultSlots,
    allExerciseNames,
    consistency,
    prs,
    weeklyGoal,
  }
}
