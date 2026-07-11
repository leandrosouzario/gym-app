'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Edit2, CheckCircle2, Plus, Trash2, Check, Minus,
  Clock, X, Search, ChevronDown, ChevronUp,
} from 'lucide-react'
import type { GymWorkoutSession, GymSessionExercise, GymSessionSet, WeightType } from '@/types/database'
import type { PlanExerciseSuggestion } from '@/features/treinos/queries'
import { DeleteSessionButton } from './DeleteSessionButton'
import {
  updateSessionTimestamps,
  updateSessionSet,
  addSetToSessionExercise,
  removeSessionSet,
  addExerciseToCompletedSession,
  recalculatePrsForSession,
} from '@/features/historico/actions'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toDatetimeLocal(isoString: string): string {
  const d = new Date(isoString)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromDatetimeLocal(localString: string): string {
  return new Date(localString).toISOString()
}

function formatDuration(start: string, end: string | null): string {
  if (!end) return '—'
  const min = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 60000)
  if (min < 1) return '< 1 min'
  if (min < 60) return `${min} min`
  return `${Math.floor(min / 60)}h ${min % 60}min`
}

function calcVolume(sets: GymSessionSet[]): number {
  return sets.reduce((acc, s) => {
    if (s.weight_value && s.reps && s.completed_at) acc += s.weight_value * s.reps
    return acc
  }, 0)
}

function weightLabel(type: WeightType, perSide: boolean): string {
  if (type === 'plates') return perSide ? 'pl/lado' : 'placas'
  return perSide ? 'kg/lado' : 'kg'
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SetLocal = GymSessionSet & { localWeight: string; localReps: string }

type ExerciseState = {
  exercise: GymSessionExercise
  sets: SetLocal[]
  expanded: boolean
}

// ---------------------------------------------------------------------------
// NumInput
// ---------------------------------------------------------------------------

function NumInput({
  value,
  onChange,
  onBlur,
  step = 1,
  min = 0,
  placeholder = '',
}: {
  value: string
  onChange: (v: string) => void
  onBlur?: () => void
  step?: number
  min?: number
  placeholder?: string
}) {
  const num = parseFloat(value) || 0
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault()
          onChange(String(Math.max(min, +(num - step).toFixed(2))))
        }}
        onPointerUp={onBlur}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 active:scale-95 transition-all"
      >
        <Minus className="h-3 w-3" />
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        step={step}
        min={min}
        placeholder={placeholder}
        inputMode="decimal"
        className="h-8 w-14 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-center text-sm font-semibold text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-gray-300 dark:placeholder:text-slate-600"
      />
      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault()
          onChange(String(+(num + step).toFixed(2)))
        }}
        onPointerUp={onBlur}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 active:scale-95 transition-all"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Exercise Picker Modal
// ---------------------------------------------------------------------------

function ExercisePicker({
  suggestions,
  onAdd,
  onClose,
  isPending,
}: {
  suggestions: PlanExerciseSuggestion[]
  onAdd: (name: string, weightType: WeightType, perSide: boolean) => void
  onClose: () => void
  isPending: boolean
}) {
  const [search, setSearch] = useState('')
  const [custom, setCustom] = useState('')
  const [weightType, setWeightType] = useState<WeightType>('kg')
  const [perSide, setPerSide] = useState(false)
  const [selected, setSelected] = useState<PlanExerciseSuggestion | null>(null)

  const filtered = suggestions.filter((s) =>
    s.exercise_name.toLowerCase().includes(search.toLowerCase())
  )

  const uniqueFiltered = filtered.filter(
    (s, i, arr) => arr.findIndex((x) => x.exercise_name === s.exercise_name) === i
  )

  function handleSelectSuggestion(suggestion: PlanExerciseSuggestion) {
    setSelected(suggestion)
    setCustom(suggestion.exercise_name)
    setWeightType(suggestion.weight_type)
    setPerSide(suggestion.weight_per_side)
  }

  function handleSubmit() {
    const name = custom.trim() || selected?.exercise_name
    if (!name) return
    onAdd(name, weightType, perSide)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white dark:bg-slate-900 shadow-xl flex flex-col max-h-[85vh]">
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
          {uniqueFiltered.length > 0 && (
            <div className="space-y-1">
              {uniqueFiltered.map((s) => (
                <button
                  key={s.exercise_name}
                  type="button"
                  onClick={() => handleSelectSuggestion(s)}
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
          )}

          {uniqueFiltered.length === 0 && search && (
            <p className="py-4 text-center text-sm text-gray-400 dark:text-slate-500">
              Nenhum exercício encontrado. Ele será criado como personalizado.
            </p>
          )}
        </div>

        {/* Config */}
        <div className="border-t border-gray-100 dark:border-slate-800 px-4 py-3 space-y-3 shrink-0">
          {/* Weight type */}
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

          {/* Per side */}
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

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || (!custom.trim() && !selected)}
            className="w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Adicionando...' : 'Adicionar exercício'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SessionEditClient({
  session: initialSession,
  exercises: initialExercises,
  sets: initialSets,
  allPlanExercises,
}: {
  session: GymWorkoutSession
  exercises: GymSessionExercise[]
  sets: GymSessionSet[]
  allPlanExercises: PlanExerciseSuggestion[]
}) {
  const [isPending, startTransition] = useTransition()
  const [editMode, setEditMode] = useState(false)
  const [showPicker, setShowPicker] = useState(false)

  // Timestamps
  const [perfAt, setPerfAt] = useState(toDatetimeLocal(initialSession.performed_at))
  const [endAt, setEndAt] = useState(
    initialSession.ended_at ? toDatetimeLocal(initialSession.ended_at) : ''
  )
  const [timestampDirty, setTimestampDirty] = useState(false)

  // Exercise/set state
  const [exerciseStates, setExerciseStates] = useState<ExerciseState[]>(() =>
    initialExercises.map((ex, idx) => ({
      exercise: ex,
      expanded: idx === 0,
      sets: initialSets
        .filter((s) => s.session_exercise_id === ex.id)
        .map((s) => ({
          ...s,
          localWeight: s.weight_value !== null ? String(s.weight_value) : '',
          localReps: s.reps !== null ? String(s.reps) : '',
        })),
    }))
  )

  // Derived stats (from local state)
  const currentPerformedAt = timestampDirty ? fromDatetimeLocal(perfAt) : initialSession.performed_at
  const currentEndedAt = timestampDirty
    ? (endAt ? fromDatetimeLocal(endAt) : null)
    : initialSession.ended_at

  const allSets = exerciseStates.flatMap((es) => es.sets)
  const completedSets = allSets.filter((s) => s.completed_at)
  const totalVolume = calcVolume(completedSets)

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function handleToggleExpanded(exerciseId: string) {
    setExerciseStates((prev) =>
      prev.map((es) =>
        es.exercise.id === exerciseId ? { ...es, expanded: !es.expanded } : es
      )
    )
  }

  function handleLocalChange(exerciseId: string, setId: string, field: 'localWeight' | 'localReps', val: string) {
    setExerciseStates((prev) =>
      prev.map((es) =>
        es.exercise.id === exerciseId
          ? { ...es, sets: es.sets.map((s) => (s.id === setId ? { ...s, [field]: val } : s)) }
          : es
      )
    )
  }

  function handleSetBlur(exerciseId: string, set: SetLocal) {
    const weight = parseFloat(set.localWeight) || null
    const reps = parseInt(set.localReps) || null
    const markCompleted = weight !== null && reps !== null

    // Optimistic local update
    setExerciseStates((prev) =>
      prev.map((es) =>
        es.exercise.id === exerciseId
          ? {
              ...es,
              sets: es.sets.map((s) =>
                s.id === set.id
                  ? {
                      ...s,
                      weight_value: weight,
                      reps,
                      completed_at: markCompleted ? (s.completed_at ?? new Date().toISOString()) : null,
                    }
                  : s
              ),
            }
          : es
      )
    )

    startTransition(async () => {
      await updateSessionSet(set.id, initialSession.id, weight, reps, markCompleted)
    })
  }

  function handleAddSet(es: ExerciseState) {
    startTransition(async () => {
      const result = await addSetToSessionExercise(es.exercise.id, initialSession.id)
      if (result.data) {
        const newSet = result.data as GymSessionSet
        setExerciseStates((prev) =>
          prev.map((e) =>
            e.exercise.id === es.exercise.id
              ? {
                  ...e,
                  sets: [
                    ...e.sets,
                    { ...newSet, localWeight: '', localReps: '' },
                  ],
                }
              : e
          )
        )
      }
    })
  }

  function handleRemoveSet(exerciseId: string, setId: string) {
    setExerciseStates((prev) =>
      prev.map((es) =>
        es.exercise.id === exerciseId
          ? { ...es, sets: es.sets.filter((s) => s.id !== setId) }
          : es
      )
    )
    startTransition(async () => {
      await removeSessionSet(setId, initialSession.id)
    })
  }

  function handleAddExercise(name: string, wType: WeightType, perSide: boolean) {
    startTransition(async () => {
      const result = await addExerciseToCompletedSession(
        initialSession.id,
        name,
        wType,
        perSide
      )
      if (result.exercise && result.sets) {
        const ex = result.exercise as GymSessionExercise
        const sets = result.sets as GymSessionSet[]
        setExerciseStates((prev) => [
          ...prev,
          {
            exercise: ex,
            expanded: true,
            sets: sets.map((s) => ({ ...s, localWeight: '', localReps: '' })),
          },
        ])
      }
      setShowPicker(false)
    })
  }

  function handleSaveTimestamps() {
    startTransition(async () => {
      await updateSessionTimestamps(
        initialSession.id,
        fromDatetimeLocal(perfAt),
        endAt ? fromDatetimeLocal(endAt) : null
      )
      setTimestampDirty(false)
    })
  }

  function handleFinishEdit() {
    startTransition(async () => {
      if (timestampDirty) {
        await updateSessionTimestamps(
          initialSession.id,
          fromDatetimeLocal(perfAt),
          endAt ? fromDatetimeLocal(endAt) : null
        )
        setTimestampDirty(false)
      }
      await recalculatePrsForSession(initialSession.id)
      setEditMode(false)
    })
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-3">
          <Link
            href="/historico"
            className="flex items-center justify-center rounded-lg p-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {initialSession.plan_name_snapshot ?? 'Treino livre'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {new Date(currentPerformedAt).toLocaleString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!editMode ? (
            <button
              type="button"
              onClick={() => setEditMode(true)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-slate-700 px-3 py-1.5 text-sm text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Editar
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinishEdit}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60 transition-colors"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {isPending ? 'Salvando...' : 'Concluir edição'}
            </button>
          )}
        </div>
      </div>

      {/* Timestamp editor */}
      {editMode && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-300">
            <Clock className="h-4 w-4" />
            Horários do treino
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Início</label>
              <input
                type="datetime-local"
                value={perfAt}
                onChange={(e) => { setPerfAt(e.target.value); setTimestampDirty(true) }}
                className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-2 text-sm text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Término</label>
              <input
                type="datetime-local"
                value={endAt}
                onChange={(e) => { setEndAt(e.target.value); setTimestampDirty(true) }}
                className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-2 text-sm text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>
          {timestampDirty && (
            <button
              type="button"
              onClick={handleSaveTimestamps}
              disabled={isPending}
              className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline disabled:opacity-50"
            >
              Salvar horários agora
            </button>
          )}
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          ['Duração', formatDuration(currentPerformedAt, currentEndedAt)],
          ['Séries', String(completedSets.length)],
          ['Volume', totalVolume > 0 ? `${totalVolume.toLocaleString('pt-BR')} kg` : '—'],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-center"
          >
            <p className="text-xs text-gray-500 dark:text-slate-400">{label}</p>
            <p className="mt-1 text-base font-bold text-gray-900 dark:text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Exercise list */}
      <div className="space-y-3">
        {exerciseStates.map((es) => {
          const unit = weightLabel(es.exercise.weight_type, es.exercise.weight_per_side)
          const completedCount = es.sets.filter((s) => s.completed_at).length

          return (
            <div
              key={es.exercise.id}
              className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
            >
              {/* Exercise header */}
              <button
                type="button"
                onClick={() => handleToggleExpanded(es.exercise.id)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{es.exercise.exercise_name}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {completedCount}/{es.sets.length} séries concluídas
                  </p>
                </div>
                {es.expanded ? (
                  <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                )}
              </button>

              {es.expanded && (
                <div className="border-t border-gray-100 dark:border-slate-800 px-4 pb-4 pt-3">
                  {/* Column headers */}
                  {editMode ? (
                    <div className="mb-2 grid grid-cols-[24px_1fr_1fr_36px_36px] gap-2 text-xs font-medium text-gray-400 dark:text-slate-500 px-1">
                      <span>#</span>
                      <span>{unit}</span>
                      <span>Reps</span>
                      <span />
                      <span />
                    </div>
                  ) : (
                    <div className="mb-2 grid grid-cols-[24px_1fr_auto_1fr] gap-2 text-xs font-medium text-gray-400 dark:text-slate-500 px-1">
                      <span>#</span>
                      <span>{unit}</span>
                      <span className="text-center">×</span>
                      <span>Reps</span>
                    </div>
                  )}

                  {/* Sets */}
                  <div className="space-y-2">
                    {es.sets.map((set) => {
                      const isDone = Boolean(set.completed_at)
                      if (editMode) {
                        return (
                          <div
                            key={set.id}
                            className={`grid grid-cols-[24px_1fr_1fr_36px_36px] items-center gap-2 rounded-lg px-1 py-1 ${
                              isDone ? 'bg-emerald-50 dark:bg-emerald-950/30' : ''
                            }`}
                          >
                            <span className="text-xs font-medium text-gray-500 dark:text-slate-400 text-center">
                              {set.set_number}
                            </span>
                            <NumInput
                              value={set.localWeight}
                              onChange={(v) => handleLocalChange(es.exercise.id, set.id, 'localWeight', v)}
                              onBlur={() => handleSetBlur(es.exercise.id, set)}
                              step={es.exercise.weight_type === 'kg' ? 2.5 : 1}
                              placeholder="—"
                            />
                            <NumInput
                              value={set.localReps}
                              onChange={(v) => handleLocalChange(es.exercise.id, set.id, 'localReps', v)}
                              onBlur={() => handleSetBlur(es.exercise.id, set)}
                              step={1}
                              min={1}
                              placeholder="—"
                            />
                            <div className="flex items-center justify-center">
                              {isDone && (
                                <Check className="h-4 w-4 text-emerald-500" />
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveSet(es.exercise.id, set.id)}
                              className="flex items-center justify-center h-8 w-8 rounded-lg text-gray-300 dark:text-slate-600 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )
                      }

                      // View mode
                      if (!isDone) return null
                      return (
                        <div key={set.id} className="grid grid-cols-[24px_1fr_auto_1fr] items-center gap-2 text-sm px-1">
                          <span className="text-center text-gray-400 dark:text-slate-500">{set.set_number}</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {set.weight_value ?? '—'} {unit}
                          </span>
                          <span className="text-gray-400">×</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {set.reps ?? '—'} reps
                          </span>
                        </div>
                      )
                    })}

                    {!editMode && es.sets.filter((s) => s.completed_at).length === 0 && (
                      <p className="text-sm text-gray-400 dark:text-slate-500">Nenhuma série registrada</p>
                    )}
                  </div>

                  {/* Add set button (edit mode only) */}
                  {editMode && (
                    <button
                      type="button"
                      onClick={() => handleAddSet(es)}
                      disabled={isPending}
                      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 dark:border-slate-700 py-2 text-sm text-gray-500 dark:text-slate-400 hover:border-emerald-400 hover:text-emerald-500 disabled:opacity-50 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Série
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add exercise button (edit mode only) */}
      {editMode && (
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-700 py-3 text-sm font-medium text-gray-500 dark:text-slate-400 hover:border-emerald-400 hover:text-emerald-500 dark:hover:border-emerald-700 dark:hover:text-emerald-400 disabled:opacity-50 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Adicionar exercício
        </button>
      )}

      {/* Delete button (view mode) */}
      {!editMode && (
        <div className="flex justify-end pb-4">
          <DeleteSessionButton sessionId={initialSession.id} />
        </div>
      )}

      {/* Exercise picker modal */}
      {showPicker && (
        <ExercisePicker
          suggestions={allPlanExercises}
          onAdd={handleAddExercise}
          onClose={() => setShowPicker(false)}
          isPending={isPending}
        />
      )}
    </div>
  )
}
