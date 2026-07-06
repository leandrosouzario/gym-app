import Link from 'next/link'
import { Play, Dumbbell, Plus, Trophy } from 'lucide-react'
import { getDashboardData } from '@/features/dashboard/queries'
import { startSession } from '@/features/sessao/actions'

function relativeDays(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'hoje'
  if (days === 1) return 'ontem'
  return `há ${days} dias`
}

export async function DashboardStats() {
  const data = await getDashboardData()

  if (!data) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-slate-400">
        Erro ao carregar dados.
      </div>
    )
  }

  const { sessionsThisWeek, totalSessions, recentPrs, lastSession, plans, weeklyGoal } = data
  const goalPct = Math.min(100, Math.round((sessionsThisWeek / weeklyGoal) * 100))

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Start workout CTA */}
      <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white">Iniciar treino</h2>
          <Link
            href="/treinos/nova"
            className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <Plus className="h-3.5 w-3.5" />
            Nova ficha
          </Link>
        </div>

        {plans.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-3">
              Crie sua primeira ficha para começar.
            </p>
            <Link
              href="/treinos/nova"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Criar ficha
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-slate-800 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{plan.name}</p>
                  {plan.description && (
                    <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{plan.description}</p>
                  )}
                </div>
                <form action={startSession.bind(null, plan.id)}>
                  <button
                    type="submit"
                    className="ml-3 flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Iniciar
                  </button>
                </form>
              </div>
            ))}
            {plans.length === 5 && (
              <Link
                href="/treinos"
                className="block text-center text-sm text-emerald-600 dark:text-emerald-400 hover:underline pt-1"
              >
                Ver todas as fichas
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: 'Esta semana',
            value: `${sessionsThisWeek}/${weeklyGoal}`,
            sub: 'treinos',
          },
          {
            label: 'Total',
            value: String(totalSessions),
            sub: 'sessões',
          },
          {
            label: 'Último treino',
            value: lastSession ? relativeDays(lastSession.performed_at) : '—',
            sub: lastSession?.plan_name_snapshot ?? '',
          },
          {
            label: 'Recordes',
            value: String(recentPrs.length),
            sub: 'recentes',
          },
        ].map(({ label, value, sub }) => (
          <div
            key={label}
            className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-center"
          >
            <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            {sub && <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 truncate">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Weekly goal progress */}
      <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-gray-900 dark:text-white">Meta da semana</span>
          <span className="text-gray-500 dark:text-slate-400">
            {sessionsThisWeek} de {weeklyGoal} treinos
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              goalPct >= 100 ? 'bg-emerald-500' : 'bg-emerald-400'
            }`}
            style={{ width: `${goalPct}%` }}
          />
        </div>
        {goalPct >= 100 && (
          <p className="mt-2 text-center text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            🎉 Meta da semana atingida!
          </p>
        )}
      </div>

      {/* Recent PRs */}
      {recentPrs.length > 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <span className="font-medium text-gray-900 dark:text-white text-sm">Recordes recentes</span>
          </div>
          <div className="space-y-2">
            {recentPrs.map((pr) => (
              <div key={pr.exercise_name} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 dark:text-slate-300 truncate">{pr.exercise_name}</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400 shrink-0 ml-2">
                  {pr.max_weight ? `${pr.max_weight} kg` : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Evolução link */}
      <div className="rounded-xl border border-dashed border-gray-300 dark:border-slate-700 p-5 text-center">
        <Dumbbell className="mx-auto h-8 w-8 text-gray-300 dark:text-slate-600 mb-2" />
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-3">
          Gráficos de evolução e análise de carga em breve.
        </p>
        <Link
          href="/evolucao"
          className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          Ver evolução →
        </Link>
      </div>
    </div>
  )
}
