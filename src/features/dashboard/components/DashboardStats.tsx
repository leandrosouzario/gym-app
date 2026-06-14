import { CalendarDays, Dumbbell, Medal, TrendingUp } from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'

const mockStats = [
  {
    title: 'Treinos esta semana',
    value: '3',
    description: 'Sessões registradas nos últimos 7 dias',
    icon: CalendarDays,
    trend: '+1 em relação à semana anterior',
  },
  {
    title: 'Sessões totais',
    value: '42',
    description: 'Histórico acumulado de treinos',
    icon: Dumbbell,
  },
  {
    title: 'PRs recentes',
    value: '2',
    description: 'Recordes pessoais nos últimos 30 dias',
    icon: Medal,
    trend: 'Supino e agachamento',
  },
  {
    title: 'Último treino',
    value: 'Treino B',
    description: 'Realizado há 2 dias',
    icon: TrendingUp,
  },
]

export function DashboardStats() {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-xl font-semibold text-white">Visão geral</h2>
        <p className="mt-1 text-sm text-slate-400">
          Resumo mockado para validação do layout. Dados reais serão integrados
          nas próximas fases.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {mockStats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>
    </div>
  )
}
