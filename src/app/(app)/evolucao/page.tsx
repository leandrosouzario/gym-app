import { TrendingUp } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'

export default function EvolucaoPage() {
  return (
    <EmptyState
      title="Evolução de carga"
      description="Acompanhe recordes pessoais e progressão de cargas ao longo do tempo. Gráficos serão adicionados futuramente."
      icon={TrendingUp}
    />
  )
}
