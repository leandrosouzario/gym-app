import { TrendingUp } from 'lucide-react'

export const metadata = { title: 'Evolução' }

export default function EvolucaoPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-700 p-12 text-center">
        <TrendingUp className="mx-auto h-12 w-12 text-gray-300 dark:text-slate-600 mb-4" />
        <p className="text-base font-medium text-gray-900 dark:text-white mb-2">
          Evolução — em breve
        </p>
        <p className="text-sm text-gray-500 dark:text-slate-400 max-w-sm mx-auto">
          Gráficos de progressão de carga, volume por exercício, frequência semanal e
          análise de consistência. Continue treinando para gerar dados suficientes.
        </p>
      </div>
    </div>
  )
}
