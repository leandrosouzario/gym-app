import { notFound } from 'next/navigation'
import { getSessionDetail } from '@/features/historico/queries'
import { getAllPlanExercisesForPicker } from '@/features/treinos/queries'
import { SessionEditClient } from './SessionEditClient'

export const metadata = { title: 'Detalhe da Sessão' }

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [data, allPlanExercises] = await Promise.all([
    getSessionDetail(id),
    getAllPlanExercisesForPicker(),
  ])

  if (!data) notFound()

  const { session, exercises, sets } = data

  return (
    <SessionEditClient
      session={session}
      exercises={exercises}
      sets={sets}
      allPlanExercises={allPlanExercises}
    />
  )
}
