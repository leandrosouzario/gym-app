import Link from 'next/link'
import { History, ChevronRight } from 'lucide-react'
import { getSessions } from '@/features/historico/queries'

export const metadata = { title: 'Histórico' }

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(start: string, end: string | null) {
  if (!end) return '—'
  const ms = new Date(end).getTime() - new Date(start).getTime()
  const min = Math.floor(ms / 60000)
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  return `${h}h ${min % 60}min`
}

function groupByWeek(sessions: Awaited<ReturnType<typeof getSessions>>) {
  const groups: { label: string; sessions: typeof sessions }[] = []
  const map = new Map<string, typeof sessions>()

  for (const s of sessions) {
    const date = new Date(s.performed_at)
    const monday = new Date(date)
    monday.setDate(date.getDate() - ((date.getDay() + 6) % 7))
    const key = monday.toISOString().slice(0, 10)

    if (!map.has(key)) {
      map.set(key, [])
      const label = monday.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
      groups.push({ label: `Semana de ${label}`, sessions: map.get(key)! })
    }
    map.get(key)!.push(s)
  }

  return groups
}

export default async function HistoricoPage() {
  const sessions = await getSessions()
  const groups = groupByWeek(sessions)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {sessions.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-700 p-12 text-center">
          <History className="mx-auto h-12 w-12 text-gray-300 dark:text-slate-600 mb-4" />
          <p className="text-base font-medium text-gray-900 dark:text-white mb-1">
            Nenhum treino ainda
          </p>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Complete uma sessão para ver seu histórico aqui.
          </p>
        </div>
      ) : (
        groups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
              {group.label} · {group.sessions.length} treino{group.sessions.length !== 1 ? 's' : ''}
            </p>
            <div className="space-y-2">
              {group.sessions.map((s) => (
                <Link
                  key={s.id}
                  href={`/historico/${s.id}`}
                  className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 hover:border-emerald-300 dark:hover:border-emerald-800 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {s.plan_name_snapshot ?? 'Treino livre'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      {formatDate(s.performed_at)} · {formatDuration(s.performed_at, s.ended_at)}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 dark:text-slate-500 shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
