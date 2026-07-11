import { notFound } from 'next/navigation'
import { getSession, getPreviousSets } from '@/features/sessao/queries'
import { getAllPlanExercisesForPicker } from '@/features/treinos/queries'
import { SessionClient } from './SessionClient'

export const metadata = { title: 'Sessão de Treino' }

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [data, allPlanExercises] = await Promise.all([
    getSession(id),
    getAllPlanExercisesForPicker(),
  ])

  if (!data) notFound()

  const { session, exercises, sets, userId } = data

  const previousSets = session.workout_plan_id
    ? await getPreviousSets(session.workout_plan_id, session.id)
    : {}

  return (
    <SessionClient
      session={session}
      exercises={exercises}
      sets={sets}
      previousSets={previousSets}
      userId={userId}
      allPlanExercises={allPlanExercises}
    />
  )
}
