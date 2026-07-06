'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Dot,
} from 'recharts'
import type { ExerciseProgressPoint } from '@/features/evolucao/queries'
import { useTheme } from '@/components/theme/ThemeProvider'

type ExerciseProgressChartProps = {
  progress: ExerciseProgressPoint[]
  currentPr: number | null
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
  })
}

function formatWeight(value: number | null) {
  if (value === null) return '—'
  return `${value} kg`
}

export function ExerciseProgressChart({ progress, currentPr }: ExerciseProgressChartProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const textColor = isDark ? '#94a3b8' : '#6b7280'
  const gridColor = isDark ? '#334155' : '#e5e7eb'
  const lineColor = '#10b981'

  if (progress.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-gray-500 dark:text-slate-400">
        Sem dados para este exercício
      </div>
    )
  }

  if (progress.length === 1) {
    const point = progress[0]
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-1">
        <p className="text-3xl font-bold text-gray-900 dark:text-white">
          {formatWeight(point.maxWeight)}
        </p>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          {point.maxReps} reps · {formatDate(point.date)}
        </p>
        <p className="text-xs text-gray-400 dark:text-slate-500">
          Faça mais sessões para ver o gráfico
        </p>
      </div>
    )
  }

  const chartData = progress.map((p) => ({
    date: formatDate(p.date),
    weight: p.maxWeight,
    reps: p.maxReps,
    isPr: p.isPr,
    rawDate: p.date,
  }))

  return (
    <div className="h-48 w-full">
      {currentPr !== null && (
        <p className="mb-2 text-xs text-amber-600 dark:text-amber-400">
          Recorde: {formatWeight(currentPr)}
        </p>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fill: textColor, fontSize: 11 }}
            axisLine={{ stroke: gridColor }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: textColor, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={36}
            tickFormatter={(v) => `${v}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#1e293b' : '#fff',
              border: `1px solid ${gridColor}`,
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelStyle={{ color: isDark ? '#e2e8f0' : '#374151' }}
            formatter={(value, _name, props) => {
              const payload = props.payload as (typeof chartData)[0]
              return [
                `${value} kg · ${payload.reps ?? '—'} reps${payload.isPr ? ' 🏆 PR' : ''}`,
                'Peso máx.',
              ]
            }}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke={lineColor}
            strokeWidth={2}
            dot={(props) => {
              const { cx, cy, payload } = props as {
                cx: number
                cy: number
                payload: (typeof chartData)[0]
              }
              if (payload.isPr) {
                return (
                  <Dot
                    key={payload.rawDate}
                    cx={cx}
                    cy={cy}
                    r={5}
                    fill="#f59e0b"
                    stroke="#fff"
                    strokeWidth={2}
                  />
                )
              }
              return (
                <Dot
                  key={payload.rawDate}
                  cx={cx}
                  cy={cy}
                  r={3}
                  fill={lineColor}
                  stroke={lineColor}
                />
              )
            }}
            activeDot={{ r: 5, fill: lineColor }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
