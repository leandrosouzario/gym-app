'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'

type ExercisePickerProps = {
  exerciseNames: string[]
  currentName: string
  onSelect: (name: string) => void
  onClose: () => void
}

export function ExercisePicker({
  exerciseNames,
  currentName,
  onSelect,
  onClose,
}: ExercisePickerProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = exerciseNames.filter(
    (name) =>
      name !== currentName &&
      name.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div
      ref={containerRef}
      className="absolute left-0 right-0 top-full z-20 mt-1 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg"
    >
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-slate-700 px-3 py-2">
        <Search className="h-4 w-4 shrink-0 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar exercício..."
          className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400"
        />
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <ul className="max-h-48 overflow-y-auto py-1">
        {filtered.length === 0 ? (
          <li className="px-3 py-2 text-sm text-gray-500 dark:text-slate-400">
            Nenhum exercício encontrado
          </li>
        ) : (
          filtered.map((name) => (
            <li key={name}>
              <button
                type="button"
                onClick={() => onSelect(name)}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
              >
                {name}
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}

type ExercisePickerTriggerProps = {
  onClick: () => void
  loading?: boolean
}

export function ExercisePickerTrigger({ onClick, loading }: ExercisePickerTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-slate-700 px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50"
    >
      {loading ? 'Carregando...' : 'Trocar'}
      <ChevronDown className="h-3 w-3" />
    </button>
  )
}
