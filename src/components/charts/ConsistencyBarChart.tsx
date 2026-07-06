'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts'
import type { WeekData } from '@/features/evolucao/queries'
import { useTheme } from '@/components/theme/ThemeProvider'

type ConsistencyBarChartProps = {
  weeks: WeekData[]
  weeklyGoal: number
}

export function ConsistencyBarChart({ weeks, weeklyGoal }: ConsistencyBarChartProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const textColor = isDark ? '#94a3b8' : '#6b7280'
  const gridColor = isDark ? '#334155' : '#e5e7eb'

  const last12 = weeks.slice(-12)
  const chartData = last12.map((w) => ({
    label: w.label,
    count: w.sessionCount,
    metGoal: w.sessionCount >= weeklyGoal,
    hasSessions: w.sessionCount > 0,
  }))

  function barColor(entry: (typeof chartData)[0]) {
    if (entry.metGoal) return '#059669'
    if (entry.hasSessions) return '#6ee7b7'
    return isDark ? '#334155' : '#e5e7eb'
  }

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fill: textColor, fontSize: 10 }}
            axisLine={{ stroke: gridColor }}
            tickLine={false}
            interval={0}
            angle={-35}
            textAnchor="end"
            height={50}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: textColor, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={24}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#1e293b' : '#fff',
              border: `1px solid ${gridColor}`,
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value) => [`${value} treino${value !== 1 ? 's' : ''}`, 'Sessões']}
          />
          <ReferenceLine
            y={weeklyGoal}
            stroke="#f59e0b"
            strokeDasharray="4 4"
            label={{
              value: `Meta: ${weeklyGoal}`,
              fill: '#f59e0b',
              fontSize: 10,
              position: 'insideTopRight',
            }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={barColor(entry)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
