import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Play } from 'lucide-react'
import { getPlanWithExercises } from '@/features/treinos/queries'
import { PlanEditor } from './PlanEditor'
import { startSession } from '@/features/sessao/actions'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getPlanWithExercises(id)
  return { title: data?.plan.name ?? 'Ficha de Treino' }
}

export default async function PlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getPlanWithExercises(id)

  if (!data) notFound()

  const { plan, exercises } = data

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/treinos"
            className="flex items-center justify-center rounded-lg p-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{plan.name}</h2>
            {plan.description && (
              <p className="text-sm text-gray-500 dark:text-slate-400">{plan.description}</p>
            )}
          </div>
        </div>
        <form action={startSession.bind(null, plan.id)}>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors shrink-0"
          >
            <Play className="h-4 w-4" />
            Iniciar
          </button>
        </form>
      </div>

      <PlanEditor plan={plan} exercises={exercises} />
    </div>
  )
}
