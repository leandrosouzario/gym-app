'use client'

import { useState, useTransition } from 'react'
import { ChevronUp, ChevronDown, Trash2, Pencil, Plus, X, Check } from 'lucide-react'
import {
  createExercise,
  updateExercise,
  deleteExercise,
  moveExercise,
  deletePlan,
  updatePlan,
} from '@/features/treinos/actions'
import type { GymWorkoutExercise, GymWorkoutPlan, WeightType } from '@/types/database'

type Props = {
  plan: GymWorkoutPlan
  exercises: GymWorkoutExercise[]
}

function weightLabel(type: WeightType, perSide: boolean) {
  if (type === 'plates') return perSide ? 'placas/lado' : 'placas'
  return perSide ? 'kg/lado' : 'kg'
}

function ExerciseForm({
  planId,
  exercise,
  onDone,
}: {
  planId: string
  exercise?: GymWorkoutExercise
  onDone: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [weightType, setWeightType] = useState<WeightType>(exercise?.weight_type ?? 'kg')
  const [perSide, setPerSide] = useState(exercise?.weight_per_side ?? false)

  function handleSubmit(formData: FormData) {
    formData.set('weight_type', weightType)
    formData.set('weight_per_side', String(perSide))
    startTransition(async () => {
      if (exercise) {
        await updateExercise(exercise.id, planId, formData)
      } else {
        await createExercise(planId, formData)
      }
      onDone()
    })
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20'

  return (
    <form action={handleSubmit} className="space-y-3 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-4">
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
          Exercício *
        </label>
        <input
          name="exercise_name"
          type="text"
          required
          defaultValue={exercise?.exercise_name}
          placeholder="Ex: Supino reto, Leg press..."
          autoFocus
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
            Séries
          </label>
          <input
            name="sets"
            type="number"
            min={1}
            max={20}
            defaultValue={exercise?.sets ?? 3}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
            Repetições
          </label>
          <input
            name="reps"
            type="number"
            min={1}
            max={200}
            defaultValue={exercise?.reps ?? 10}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
          Tipo de peso
        </label>
        <div className="flex gap-2">
          {(['kg', 'plates'] as WeightType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setWeightType(t)}
              className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                weightType === t
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : 'border-gray-300 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-gray-400'
              }`}
            >
              {t === 'kg' ? 'Quilos (kg)' : 'Placas'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
            Peso-alvo ({weightLabel(weightType, perSide)})
          </label>
          <input
            name="target_weight"
            type="number"
            step="0.5"
            min={0}
            defaultValue={exercise?.target_weight ?? ''}
            placeholder="—"
            className={inputClass}
          />
        </div>
        <div className="flex items-end pb-0.5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={perSide}
              onChange={(e) => setPerSide(e.target.checked)}
              className="h-4 w-4 rounded accent-emerald-500"
            />
            <span className="text-sm text-gray-600 dark:text-slate-400">Por lado</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
          Notas (opcional)
        </label>
        <input
          name="notes"
          type="text"
          defaultValue={exercise?.notes ?? ''}
          placeholder="Ex: Contrair no topo"
          className={inputClass}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-lg bg-emerald-500 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60 transition-colors"
        >
          {isPending ? 'Salvando...' : exercise ? 'Salvar' : 'Adicionar'}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-gray-300 dark:border-slate-700 px-4 py-2 text-sm text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

export function PlanEditor({ plan, exercises }: Props) {
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingPlan, setEditingPlan] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete(exerciseId: string) {
    if (!confirm('Remover este exercício?')) return
    startTransition(() => deleteExercise(exerciseId, plan.id))
  }

  function handleDeletePlan() {
    if (!confirm(`Excluir a ficha "${plan.name}"? Esta ação não pode ser desfeita.`)) return
    startTransition(async () => { await deletePlan(plan.id) })
  }

  return (
    <div className="space-y-4">
      {/* Plan header actions */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-slate-400">
          {exercises.length} {exercises.length === 1 ? 'exercício' : 'exercícios'}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditingPlan((v) => !v)}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
            Editar nome
          </button>
          <button
            onClick={handleDeletePlan}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Excluir ficha
          </button>
        </div>
      </div>

      {/* Edit plan name */}
      {editingPlan && (
        <form
          action={(fd) =>
            startTransition(async () => {
              await updatePlan(plan.id, fd)
              setEditingPlan(false)
            })
          }
          className="flex gap-2"
        >
          <input
            name="name"
            defaultValue={plan.name}
            required
            className="flex-1 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          <input name="description" defaultValue={plan.description ?? ''} type="hidden" />
          <button type="submit" className="rounded-lg bg-emerald-500 p-2 text-white hover:bg-emerald-600">
            <Check className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setEditingPlan(false)}
            className="rounded-lg border border-gray-300 dark:border-slate-700 p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </form>
      )}

      {/* Exercise list */}
      <div className="space-y-2">
        {exercises.map((ex, idx) => (
          <div key={ex.id}>
            {editingExerciseId === ex.id ? (
              <ExerciseForm
                planId={plan.id}
                exercise={ex}
                onDone={() => setEditingExerciseId(null)}
              />
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() =>
                      startTransition(() => moveExercise(ex.id, plan.id, 'up'))
                    }
                    disabled={idx === 0 || isPending}
                    className="rounded p-0.5 text-gray-400 dark:text-slate-600 hover:text-gray-700 dark:hover:text-white disabled:opacity-20 transition-colors"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() =>
                      startTransition(() => moveExercise(ex.id, plan.id, 'down'))
                    }
                    disabled={idx === exercises.length - 1 || isPending}
                    className="rounded p-0.5 text-gray-400 dark:text-slate-600 hover:text-gray-700 dark:hover:text-white disabled:opacity-20 transition-colors"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                    {ex.exercise_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {ex.sets}×{ex.reps}
                    {ex.target_weight
                      ? ` · ${ex.target_weight} ${weightLabel(ex.weight_type, ex.weight_per_side)}`
                      : ''}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setEditingExerciseId(ex.id)}
                    className="rounded-lg p-1.5 text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-white transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(ex.id)}
                    className="rounded-lg p-1.5 text-gray-400 dark:text-slate-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {showAddForm ? (
          <ExerciseForm planId={plan.id} onDone={() => setShowAddForm(false)} />
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-700 py-3 text-sm font-medium text-gray-500 dark:text-slate-400 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Adicionar exercício
          </button>
        )}
      </div>
    </div>
  )
}
