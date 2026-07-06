import Link from 'next/link'
import { Dumbbell, Plus, Play, ChevronRight } from 'lucide-react'
import { getPlans } from '@/features/treinos/queries'
import { startSession } from '@/features/sessao/actions'

export const metadata = { title: 'Treinos' }

export default async function TreinosPage() {
  const plans = await getPlans()

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Minhas fichas</h2>
        <Link
          href="/treinos/nova"
          className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nova ficha
        </Link>
      </div>

      {plans.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-700 p-12 text-center">
          <Dumbbell className="mx-auto h-12 w-12 text-gray-300 dark:text-slate-600 mb-4" />
          <p className="text-base font-medium text-gray-900 dark:text-white mb-1">
            Nenhuma ficha ainda
          </p>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
            Crie sua primeira ficha de treino para começar.
          </p>
          <Link
            href="/treinos/nova"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Criar primeira ficha
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{plan.name}</p>
                  {plan.description && (
                    <p className="text-sm text-gray-500 dark:text-slate-400 truncate mt-0.5">
                      {plan.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <form action={startSession.bind(null, plan.id)}>
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
                    >
                      <Play className="h-4 w-4" />
                      Iniciar
                    </button>
                  </form>
                  <Link
                    href={`/treinos/${plan.id}`}
                    className="flex items-center justify-center rounded-lg p-2 text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-white transition-colors"
                    aria-label="Editar ficha"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
