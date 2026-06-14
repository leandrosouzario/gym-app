import { History } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'

export default function HistoricoPage() {
  return (
    <EmptyState
      title="Histórico de treinos"
      description="Consulte sessões realizadas e registros de exercícios. Esta área será populada nas próximas etapas."
      icon={History}
    />
  )
}
