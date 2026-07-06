'use client'

import { useState, useTransition } from 'react'
import { TrendingUp, Trophy, Calendar, Search } from 'lucide-react'
import { ExerciseProgressChart } from '@/components/charts/ExerciseProgressChart'
import { ConsistencyBarChart } from '@/components/charts/ConsistencyBarChart'
import { WeeklyHeatmap } from '@/components/charts/WeeklyHeatmap'
import { ExercisePicker, ExercisePickerTrigger } from '@/components/charts/ExercisePicker'
import { fetchExerciseProgress } from '@/features/evolucao/actions'
import type {
  ConsistencyData,
  ExerciseSlotData,
  PrRecord,
} from '@/features/evolucao/queries'

type Tab = 'exercicios' | 'consistencia' | 'recordes'

type EvolucaoClientProps = {
  defaultSlots: ExerciseSlotData[]
  allExerciseNames: string[]
  consistency: ConsistencyData
  prs: PrRecord[]
  weeklyGoal: number
}

const EMPTY_SLOTS = 3

function formatPrDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function EvolucaoClient({
  defaultSlots,
  allExerciseNames,
  consistency,
  prs,
  weeklyGoal,
}: EvolucaoClientProps) {
  const [tab, setTab] = useState<Tab>('exercicios')
  const [slots, setSlots] = useState<ExerciseSlotData[]>(defaultSlots)
  const [openPickerIndex, setOpenPickerIndex] = useState<number | null>(null)
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null)
  const [prSearch, setPrSearch] = useState('')
  const [isPending, startTransition] = useTransition()

  const hasAnyData = allExerciseNames.length > 0

  function handleExerciseSelect(slotIndex: number, exerciseName: string) {
    setOpenPickerIndex(null)
    setLoadingIndex(slotIndex)

    startTransition(async () => {
      const result = await fetchExerciseProgress(exerciseName)
      setLoadingIndex(null)

      if (!result) return

      setSlots((prev) => {
        const next = [...prev]
        next[slotIndex] = {
          exerciseName,
          progress: result.progress,
          currentPr: result.currentPr,
        }
        return next
      })
    })
  }

  const filteredPrs = prs.filter((pr) =>
    pr.exercise_name.toLowerCase().includes(prSearch.toLowerCase())
  )

  const tabs: { id: Tab; label: string; icon: typeof TrendingUp }[] = [
    { id: 'exercicios', label: 'Exercícios', icon: TrendingUp },
    { id: 'consistencia', label: 'Consistência', icon: Calendar },
    { id: 'recordes', label: 'Recordes', icon: Trophy },
  ]

  if (!hasAnyData) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-700 p-12 text-center">
        <TrendingUp className="mx-auto h-12 w-12 text-gray-300 dark:text-slate-600 mb-4" />
        <p className="text-base font-medium text-gray-900 dark:text-white mb-2">
          Nenhum dado ainda
        </p>
        <p className="text-sm text-gray-500 dark:text-slate-400 max-w-sm mx-auto">
          Complete alguns treinos para ver gráficos de evolução, consistência e recordes pessoais.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 p-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition-colors sm:text-sm ${
              tab === id
                ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'exercicios' && (
        <div className="space-y-4">
          {Array.from({ length: EMPTY_SLOTS }).map((_, index) => {
            const slot = slots[index]
            const isLoading = loadingIndex === index || (isPending && loadingIndex === index)

            if (!slot) {
              return (
                <div
                  key={index}
                  className="rounded-xl border border-dashed border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 text-center"
                >
                  <p className="text-sm text-gray-400 dark:text-slate-500">
                    Sem exercício para exibir
                  </p>
                </div>
              )
            }

            return (
              <div
                key={`${slot.exerciseName}-${index}`}
                className="relative rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="truncate font-semibold text-gray-900 dark:text-white text-sm">
                    {slot.exerciseName}
                  </h3>
                  <ExercisePickerTrigger
                    onClick={() =>
                      setOpenPickerIndex(openPickerIndex === index ? null : index)
                    }
                    loading={isLoading}
                  />
                </div>

                {openPickerIndex === index && (
                  <ExercisePicker
                    exerciseNames={allExerciseNames}
                    currentName={slot.exerciseName}
                    onSelect={(name) => handleExerciseSelect(index, name)}
                    onClose={() => setOpenPickerIndex(null)}
                  />
                )}

                <ExerciseProgressChart
                  progress={slot.progress}
                  currentPr={slot.currentPr}
                />
              </div>
            )
          })}
        </div>
      )}

      {tab === 'consistencia' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-center">
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Sequência atual</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {consistency.currentStreak}
              </p>
              <p className="text-xs text-gray-400 dark:text-slate-500">
                semana{consistency.currentStreak !== 1 ? 's' : ''} na meta
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-center">
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Recorde</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {consistency.recordStreak}
              </p>
              <p className="text-xs text-gray-400 dark:text-slate-500">
                semana{consistency.recordStreak !== 1 ? 's' : ''} consecutivas
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
              Frequência semanal
            </h3>
            <WeeklyHeatmap weeks={consistency.weeks} weeklyGoal={weeklyGoal} />
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
              Sessões por semana
            </h3>
            <ConsistencyBarChart weeks={consistency.weeks} weeklyGoal={weeklyGoal} />
          </div>
        </div>
      )}

      {tab === 'recordes' && (
        <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-gray-200 dark:border-slate-700 px-3 py-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={prSearch}
              onChange={(e) => setPrSearch(e.target.value)}
              placeholder="Buscar exercício..."
              className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400"
            />
          </div>

          {filteredPrs.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500 dark:text-slate-400">
              {prs.length === 0
                ? 'Nenhum recorde registrado ainda. Continue treinando!'
                : 'Nenhum resultado para a busca.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-700 text-left">
                    <th className="pb-2 pr-4 font-medium text-gray-500 dark:text-slate-400">
                      Exercício
                    </th>
                    <th className="pb-2 pr-4 font-medium text-gray-500 dark:text-slate-400">
                      Peso máx.
                    </th>
                    <th className="pb-2 font-medium text-gray-500 dark:text-slate-400">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPrs.map((pr) => (
                    <tr
                      key={pr.exercise_name}
                      className="border-b border-gray-100 dark:border-slate-800 last:border-0"
                    >
                      <td className="py-2.5 pr-4 text-gray-900 dark:text-white truncate max-w-[140px]">
                        {pr.exercise_name}
                      </td>
                      <td className="py-2.5 pr-4 font-semibold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                        {pr.max_weight ? `${pr.max_weight} kg` : '—'}
                      </td>
                      <td className="py-2.5 text-gray-500 dark:text-slate-400 whitespace-nowrap">
                        {formatPrDate(pr.achieved_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
