import { createClient } from '@/lib/supabase/server'

export async function getDashboardData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [sessionsThisWeek, totalSessions, recentPrs, lastSession, plans, settings] =
    await Promise.all([
      supabase
        .from('gym_workout_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('performed_at', sevenDaysAgo),

      supabase
        .from('gym_workout_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'completed'),

      supabase
        .from('gym_exercise_prs')
        .select('exercise_name, max_weight, achieved_at')
        .eq('user_id', user.id)
        .order('achieved_at', { ascending: false })
        .limit(3),

      supabase
        .from('gym_workout_sessions')
        .select('plan_name_snapshot, performed_at, ended_at')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('performed_at', { ascending: false })
        .limit(1)
        .maybeSingle(),

      supabase
        .from('gym_workout_plans')
        .select('id, name, description')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(5),

      supabase
        .from('gym_user_settings')
        .select('weekly_goal')
        .eq('user_id', user.id)
        .maybeSingle(),
    ])

  return {
    sessionsThisWeek: sessionsThisWeek.count ?? 0,
    totalSessions: totalSessions.count ?? 0,
    recentPrs: recentPrs.data ?? [],
    lastSession: lastSession.data,
    plans: plans.data ?? [],
    weeklyGoal: settings.data?.weekly_goal ?? 3,
  }
}
