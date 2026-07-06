import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createPlan } from '@/features/treinos/actions'

export const metadata = { title: 'Nova Ficha' }

export default function NovaTreinoPage() {
  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/treinos"
          className="flex items-center justify-center rounded-lg p-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Nova ficha de treino</h2>
      </div>

      <form action={createPlan} className="space-y-4">
        <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5"
            >
              Nome da ficha *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Ex: Treino A — Superiores"
              autoFocus
              className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5"
            >
              Descrição (opcional)
            </label>
            <input
              id="description"
              name="description"
              type="text"
              placeholder="Ex: Peito, ombro, tríceps"
              className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white hover:bg-emerald-600 transition-colors"
        >
          Criar ficha
        </button>
      </form>
    </div>
  )
}
