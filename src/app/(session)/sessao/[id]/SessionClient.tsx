'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { ChevronDown, ChevronUp, Plus, Minus, Check, X, Trophy, Search } from 'lucide-react'
import {
  logSet,
  uncompleteSet,
  addSet,
  removeLastSet,
  finishSession,
  cancelSession,
  checkAndUpdatePr,
  addExerciseToSession,
} from '@/features/sessao/actions'
import type {
  GymWorkoutSession,
  GymSessionExercise,
  GymSessionSet,
  WeightType,
} from '@/types/database'
import type { PlanExerciseSuggestion } from '@/features/treinos/queries'

type PreviousSets = Record<string, { weight_value: number | null; reps: number | null }[]>

type SetState = GymSessionSet & { localWeight: string; localReps: string }

type ExerciseState = {
  exercise: GymSessionExercise
  sets: SetState[]
  expanded: boolean
}

type ToastMsg = { id: number; text: string }

function formatDuration(ms: number) {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function weightLabel(type: WeightType, perSide: boolean) {
  if (type === 'plates') return perSide ? 'pl/lado' : 'placas'
  return perSide ? 'kg/lado' : 'kg'
}

function weightIncrement(type: WeightType) {
  return type === 'kg' ? 2.5 : 1
}

function NumInput({
  value,
  onChange,
  step = 1,
  min = 0,
}: {
  value: string
  onChange: (v: string) => void
  step?: number
  min?: number
}) {
  const num = parseFloat(value) || 0
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onPointerDown={(e) => { e.preventDefault(); onChange(String(Math.max(min, +(num - step).toFixed(2)))) }}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 active:scale-95 transition-all"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        step={step}
        min={min}
        inputMode="decimal"
        className="h-9 w-16 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-center text-sm font-semibold text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
      />
      <button
        type="button"
        onPointerDown={(e) => { e.preventDefault(); onChange(String(+(num + step).toFixed(2))) }}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 active:scale-95 transition-all"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Exercise Picker Modal (2B)
// ---------------------------------------------------------------------------

function AddExercisePicker({
  suggestions,
  onAdd,
  onClose,
  isPending,
}: {
  suggestions: PlanExerciseSuggestion[]
  onAdd: (name: string, weightType: WeightType, perSide: boolean, sets: number) => void
  onClose: () => void
  isPending: boolean
}) {
  const [search, setSearch] = useState('')
  const [custom, setCustom] = useState('')
  const [weightType, setWeightType] = useState<WeightType>('kg')
  const [perSide, setPerSide] = useState(false)
  const [setsCount, setSetsCount] = useState(3)
  const [selected, setSelected] = useState<PlanExerciseSuggestion | null>(null)

  const uniqueSuggestions = suggestions.filter(
    (s, i, arr) => arr.findIndex((x) => x.exercise_name === s.exercise_name) === i
  )

  const filtered = uniqueSuggestions.filter((s) =>
    s.exercise_name.toLowerCase().includes(search.toLowerCase())
  )

  function handleSelect(s: PlanExerciseSuggestion) {
    setSelected(s)
    setCustom(s.exercise_name)
    setWeightType(s.weight_type)
    setPerSide(s.weight_per_side)
  }

  function handleSubmit() {
    const name = custom.trim() || selected?.exercise_name
    if (!name) return
    onAdd(name, weightType, perSide, setsCount)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100 dark:border-slate-800 shrink-0">
          <h3 className="font-semibold text-gray-900 dark:text-white">Adicionar exercício</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pt-3 pb-2 shrink-0">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-3 py-2">
            <Search className="h-4 w-4 text-gray-400 shrink-0" />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCustom(e.target.value); setSelected(null) }}
              placeholder="Buscar ou digitar novo exercício..."
              className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 pb-2">
          {filtered.length > 0 ? (
            <div className="space-y-1">
              {filtered.map((s) => (
                <button
                  key={s.exercise_name}
                  type="button"
                  onClick={() => handleSelect(s)}
                  className={`w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors ${
                    selected?.exercise_name === s.exercise_name
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800'
                      : 'hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{s.exercise_name}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">{s.plan_name}</p>
                  </div>
                  {selected?.exercise_name === s.exercise_name && (
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          ) : (
            search && (
              <p className="py-4 text-center text-sm text-gray-400 dark:text-slate-500">
                Exercício não encontrado — será criado como personalizado.
              </p>
            )
          )}
        </div>

        {/* Config */}
        <div className="border-t border-gray-100 dark:border-slate-800 px-4 py-3 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-slate-400">Tipo de peso</span>
            <div className="flex rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
              {(['kg', 'plates'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setWeightType(t)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    weightType === t
                      ? 'bg-emerald-500 text-white'
                      : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {t === 'kg' ? 'kg' : 'Placas'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-slate-400">Por lado</span>
            <button
              type="button"
              onClick={() => setPerSide((v) => !v)}
              className={`relative h-6 w-10 rounded-full transition-colors ${
                perSide ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  perSide ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-slate-400">Número de séries</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSetsCount((n) => Math.max(1, n - 1))}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-4 text-center text-sm font-semibold text-gray-900 dark:text-white">
                {setsCount}
              </span>
              <button
                type="button"
                onClick={() => setSetsCount((n) => Math.min(10, n + 1))}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || (!custom.trim() && !selected)}
            className="w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Adicionando...' : 'Adicionar ao treino'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main session component
// ---------------------------------------------------------------------------

export function SessionClient({
  session,
  exercises,
  sets,
  previousSets,
  userId,
  allPlanExercises,
}: {
  session: GymWorkoutSession
  exercises: GymSessionExercise[]
  sets: GymSessionSet[]
  previousSets: PreviousSets
  userId: string
  allPlanExercises: PlanExerciseSuggestion[]
}) {
  const startTime = useRef(new Date(session.performed_at).getTime())
  const [elapsed, setElapsed] = useState(Date.now() - startTime.current)
  const [toasts, setToasts] = useState<ToastMsg[]>([])
  const toastId = useRef(0)
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [addExPending, startAddExTransition] = useTransition()

  const initExercises = useCallback((): ExerciseState[] => {
    return exercises.map((ex, idx) => {
      const exSets = sets
        .filter((s) => s.session_exercise_id === ex.id)
        .map((s, sIdx) => {
          const prev = previousSets[ex.exercise_name]?.[sIdx]
          return {
            ...s,
            localWeight: s.weight_value !== null
              ? String(s.weight_value)
              : prev?.weight_value !== null && prev?.weight_value !== undefined
                ? String(prev.weight_value)
                : '',
            localReps: s.reps !== null
              ? String(s.reps)
              : prev?.reps !== null && prev?.reps !== undefined
                ? String(prev.reps)
                : '',
          }
        })
      return { exercise: ex, sets: exSets, expanded: idx === 0 }
    })
  }, [exercises, sets, previousSets])

  const [exerciseStates, setExerciseStates] = useState<ExerciseState[]>(initExercises)

  useEffect(() => {
    const id = setInterval(() => setElapsed(Date.now() - startTime.current), 1000)
    return () => clearInterval(id)
  }, [])

  function addToast(text: string) {
    const id = ++toastId.current
    setToasts((t) => [...t, { id, text }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500)
  }

  function updateSet(exerciseId: string, setId: string, patch: Partial<SetState>) {
    setExerciseStates((prev) =>
      prev.map((es) =>
        es.exercise.id === exerciseId
          ? { ...es, sets: es.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)) }
          : es
      )
    )
  }

  function toggleExpanded(exerciseId: string) {
    setExerciseStates((prev) =>
      prev.map((es) =>
        es.exercise.id === exerciseId ? { ...es, expanded: !es.expanded } : es
      )
    )
  }

  async function handleComplete(es: ExerciseState, set: SetState) {
    const weight = parseFloat(set.localWeight) || null
    const reps = parseInt(set.localReps) || null

    updateSet(es.exercise.id, set.id, { completed_at: new Date().toISOString(), weight_value: weight, reps })

    await logSet(set.id, weight, reps)

    if (weight && reps) {
      const result = await checkAndUpdatePr(userId, es.exercise.exercise_name, weight, reps, es.exercise.weight_type)
      if (result.isNewPr) {
        addToast(`🏆 Novo recorde em ${es.exercise.exercise_name}!`)
      }
    }
  }

  async function handleUncomplete(es: ExerciseState, set: SetState) {
    updateSet(es.exercise.id, set.id, { completed_at: null })
    await uncompleteSet(set.id)
  }

  async function handleAddSet(es: ExerciseState) {
    const result = await addSet(es.exercise.id)
    if (result.data) {
      const newSet: SetState = {
        ...result.data,
        localWeight: es.sets.at(-1)?.localWeight ?? '',
        localReps: es.sets.at(-1)?.localReps ?? '',
      }
      setExerciseStates((prev) =>
        prev.map((e) =>
          e.exercise.id === es.exercise.id ? { ...e, sets: [...e.sets, newSet] } : e
        )
      )
    }
  }

  async function handleRemoveSet(es: ExerciseState) {
    const last = es.sets.at(-1)
    if (!last || last.completed_at) return
    const result = await removeLastSet(es.exercise.id)
    if (result.success) {
      setExerciseStates((prev) =>
        prev.map((e) =>
          e.exercise.id === es.exercise.id ? { ...e, sets: e.sets.slice(0, -1) } : e
        )
      )
    }
  }

  function handleAddExercise(name: string, wType: WeightType, perSide: boolean, setsCount: number) {
    startAddExTransition(async () => {
      const result = await addExerciseToSession(session.id, name, wType, perSide, setsCount)
      if (result.exercise && result.sets) {
        const ex = result.exercise as GymSessionExercise
        const newSets = (result.sets as GymSessionSet[]).map((s) => ({
          ...s,
          localWeight: '',
          localReps: '',
        }))
        setExerciseStates((prev) => [
          ...prev,
          { exercise: ex, sets: newSets, expanded: true },
        ])
      }
      setShowAddExercise(false)
    })
  }

  const completedSets = exerciseStates.flatMap((e) => e.sets).filter((s) => s.completed_at).length
  const totalSets = exerciseStates.flatMap((e) => e.sets).length

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-slate-950">
      {/* Fixed session header */}
      <header className="sticky top-0 z-30 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-gray-900 dark:text-white truncate max-w-[180px] sm:max-w-xs">
              {session.plan_name_snapshot ?? 'Treino'}
            </p>
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-slate-400">
              <span className="tabular-nums">{formatDuration(elapsed)}</span>
              <span>{completedSets}/{totalSets} séries</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <form
              action={cancelSession.bind(null, session.id)}
              onSubmit={(e) => { if (!confirm('Cancelar o treino?')) e.preventDefault() }}
            >
              <button
                type="submit"
                className="rounded-lg border border-gray-300 dark:border-slate-700 px-3 py-1.5 text-sm text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
            </form>
            <form action={finishSession.bind(null, session.id)}>
              <button
                type="submit"
                className="rounded-lg bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
              >
                Finalizar
              </button>
            </form>
          </div>
        </div>
        {totalSets > 0 && (
          <div className="mx-auto mt-2 max-w-2xl">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${(completedSets / totalSets) * 100}%` }}
              />
            </div>
          </div>
        )}
      </header>

      {/* Exercises */}
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-3 p-4">
        {exerciseStates.map((es) => {
          const prevSets = previousSets[es.exercise.exercise_name] ?? []
          const completedCount = es.sets.filter((s) => s.completed_at).length
          const inc = weightIncrement(es.exercise.weight_type)
          const unit = weightLabel(es.exercise.weight_type, es.exercise.weight_per_side)

          return (
            <div
              key={es.exercise.id}
              className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleExpanded(es.exercise.id)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {es.exercise.exercise_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {completedCount}/{es.sets.length} séries concluídas
                    {prevSets.length > 0 && es.sets.length > 0 && (
                      <span className="ml-2 text-slate-400 dark:text-slate-500">
                        · Ant: {prevSets[0]?.weight_value ?? '—'} {unit} × {prevSets[0]?.reps ?? '—'}
                      </span>
                    )}
                  </p>
                </div>
                {es.expanded ? (
                  <ChevronUp className="h-5 w-5 shrink-0 text-gray-400 dark:text-slate-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 shrink-0 text-gray-400 dark:text-slate-500" />
                )}
              </button>

              {es.expanded && (
                <div className="border-t border-gray-100 dark:border-slate-800 px-4 pb-4 pt-3">
                  {/* Column headers */}
                  <div className="mb-2 grid grid-cols-[28px_1fr_1fr_44px] gap-2 text-xs font-medium text-gray-400 dark:text-slate-500 px-1">
                    <span>#</span>
                    <span>{unit}</span>
                    <span>Reps</span>
                    <span />
                  </div>

                  {/* Set rows */}
                  <div className="space-y-2">
                    {es.sets.map((set, sIdx) => {
                      const isDone = Boolean(set.completed_at)
                      return (
                        <div
                          key={set.id}
                          className={`grid grid-cols-[28px_1fr_1fr_44px] items-center gap-2 rounded-lg px-1 py-1.5 transition-colors ${
                            isDone
                              ? 'bg-emerald-50 dark:bg-emerald-950/30'
                              : ''
                          }`}
                        >
                          <span className="text-sm font-medium text-gray-500 dark:text-slate-400 text-center">
                            {set.set_number}
                          </span>
                          <NumInput
                            value={set.localWeight}
                            onChange={(v) => updateSet(es.exercise.id, set.id, { localWeight: v })}
                            step={inc}
                          />
                          <NumInput
                            value={set.localReps}
                            onChange={(v) => updateSet(es.exercise.id, set.id, { localReps: v })}
                            step={1}
                            min={1}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              isDone
                                ? handleUncomplete(es, set)
                                : handleComplete(es, set)
                            }
                            className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors active:scale-95 ${
                              isDone
                                ? 'bg-emerald-500 text-white'
                                : 'border-2 border-gray-300 dark:border-slate-600 text-gray-300 dark:text-slate-600 hover:border-emerald-400 hover:text-emerald-400'
                            }`}
                          >
                            <Check className="h-5 w-5" strokeWidth={2.5} />
                          </button>
                        </div>
                      )
                    })}
                  </div>

                  {/* Add/remove/mark-all set buttons */}
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddSet(es)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 dark:border-slate-700 py-2 text-sm text-gray-500 dark:text-slate-400 hover:border-emerald-400 hover:text-emerald-500 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Série
                    </button>
                    {es.sets.some((s) => !s.completed_at) && (
                      <button
                        type="button"
                        onClick={() => {
                          es.sets
                            .filter((s) => !s.completed_at)
                            .forEach((s) => handleComplete(es, s))
                        }}
                        className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-emerald-400 dark:border-emerald-700 px-3 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Todos
                      </button>
                    )}
                    {es.sets.length > 1 && !es.sets.at(-1)?.completed_at && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSet(es)}
                        className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 dark:border-slate-700 px-3 py-2 text-sm text-gray-400 dark:text-slate-500 hover:border-red-300 hover:text-red-400 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {exerciseStates.length === 0 && (
          <div className="py-12 text-center text-gray-500 dark:text-slate-400">
            <p>Nenhum exercício nesta sessão.</p>
          </div>
        )}

        {/* Add exercise button */}
        <button
          type="button"
          onClick={() => setShowAddExercise(true)}
          disabled={addExPending}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-700 py-3 text-sm font-medium text-gray-400 dark:text-slate-500 hover:border-emerald-400 hover:text-emerald-500 dark:hover:border-emerald-700 dark:hover:text-emerald-400 disabled:opacity-50 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Adicionar exercício
        </button>

        <div className="pb-8" />
      </main>

      {/* PR Toasts */}
      <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 text-sm font-bold text-amber-950 shadow-lg animate-bounce"
          >
            <Trophy className="h-4 w-4" />
            {t.text}
          </div>
        ))}
      </div>

      {/* Add exercise modal */}
      {showAddExercise && (
        <AddExercisePicker
          suggestions={allPlanExercises}
          onAdd={handleAddExercise}
          onClose={() => setShowAddExercise(false)}
          isPending={addExPending}
        />
      )}
    </div>
  )
}
