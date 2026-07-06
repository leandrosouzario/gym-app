import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getSessionDetail } from '@/features/historico/queries'
import { DeleteSessionButton } from './DeleteSessionButton'
import type { GymSessionExercise, GymSessionSet } from '@/types/database'

export const metadata = { title: 'Detalhe da Sessão' }

function formatDuration(start: string, end: string | null) {
  if (!end) return '—'
  const ms = new Date(end).getTime() - new Date(start).getTime()
  const min = Math.floor(ms / 60000)
  if (min < 60) return `${min} min`
  return `${Math.floor(min / 60)}h ${min % 60}min`
}

function calcVolume(sets: GymSessionSet[]) {
  return sets.reduce((acc, s) => {
    if (s.weight_value && s.reps) acc += s.weight_value * s.reps
    return acc
  }, 0)
}

function ExerciseSets({
  exercise,
  sets,
}: {
  exercise: GymSessionExercise
  sets: GymSessionSet[]
}) {
  const exSets = sets.filter((s) => s.session_exercise_id === exercise.id)
  const unit = exercise.weight_type === 'plates'
    ? exercise.weight_per_side ? 'pl/lado' : 'placas'
    : exercise.weight_per_side ? 'kg/lado' : 'kg'

  return (
    <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
      <p className="font-semibold text-gray-900 dark:text-white mb-3">{exercise.exercise_name}</p>
      {exSets.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-slate-500">Nenhuma série registrada</p>
      ) : (
        <div className="space-y-1.5">
          {exSets.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 text-sm"
            >
              <span className="w-6 text-center text-gray-400 dark:text-slate-500">{s.set_number}</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {s.weight_value ?? '—'} {unit}
              </span>
              <span className="text-gray-500 dark:text-slate-400">×</span>
              <span className="font-medium text-gray-900 dark:text-white">{s.reps ?? '—'} reps</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getSessionDetail(id)
  if (!data) notFound()

  const { session, exercises, sets } = data
  const completedSets = sets.filter((s) => s.completed_at)
  const totalVolume = calcVolume(completedSets)

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-3">
          <Link
            href="/historico"
            className="flex items-center justify-center rounded-lg p-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {session.plan_name_snapshot ?? 'Treino livre'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {new Date(session.performed_at).toLocaleString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
        <DeleteSessionButton sessionId={session.id} />
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          ['Duração', formatDuration(session.performed_at, session.ended_at)],
          ['Séries', String(completedSets.length)],
          ['Volume', totalVolume > 0 ? `${totalVolume.toLocaleString('pt-BR')} kg` : '—'],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-center"
          >
            <p className="text-xs text-gray-500 dark:text-slate-400">{label}</p>
            <p className="mt-1 text-base font-bold text-gray-900 dark:text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Exercise detail */}
      <div className="space-y-3">
        {exercises.map((ex) => (
          <ExerciseSets key={ex.id} exercise={ex} sets={sets} />
        ))}
      </div>
    </div>
  )
}
