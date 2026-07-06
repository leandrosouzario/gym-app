'use client'

import type { WeekData } from '@/features/evolucao/queries'

type WeeklyHeatmapProps = {
  weeks: WeekData[]
  weeklyGoal: number
}

function cellColor(count: number, weeklyGoal: number): string {
  if (count === 0) return 'bg-gray-200 dark:bg-slate-700'
  if (count >= weeklyGoal) return 'bg-emerald-600'
  if (count >= 2) return 'bg-emerald-400'
  return 'bg-emerald-200 dark:bg-emerald-800'
}

export function WeeklyHeatmap({ weeks, weeklyGoal }: WeeklyHeatmapProps) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max gap-1.5">
        {weeks.map((week) => (
          <div key={week.weekStart} className="flex flex-col items-center gap-1">
            <div
              className={`h-10 w-8 rounded-md ${cellColor(week.sessionCount, weeklyGoal)} transition-colors`}
              title={`${week.sessionCount} treino${week.sessionCount !== 1 ? 's' : ''}`}
            />
            <span className="text-[10px] text-gray-400 dark:text-slate-500 whitespace-nowrap">
              {week.label}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-gray-200 dark:bg-slate-700" />
          0
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-emerald-200 dark:bg-emerald-800" />
          1
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-emerald-400" />
          2
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-emerald-600" />
          ≥ meta
        </span>
      </div>
    </div>
  )
}
