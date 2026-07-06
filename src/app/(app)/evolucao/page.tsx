import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getEvolucaoData } from '@/features/evolucao/queries'
import { EvolucaoClient } from './EvolucaoClient'

export const metadata = { title: 'Evolução' }

export default async function EvolucaoPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const data = await getEvolucaoData()
  if (!data) redirect('/')

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Evolução</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
          Acompanhe sua progressão, consistência e recordes pessoais.
        </p>
      </div>

      <EvolucaoClient
        defaultSlots={data.defaultSlots}
        allExerciseNames={data.allExerciseNames}
        consistency={data.consistency}
        prs={data.prs}
        weeklyGoal={data.weeklyGoal}
      />
    </div>
  )
}
