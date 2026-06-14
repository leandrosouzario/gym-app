import { Dumbbell } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'

export default function TreinosPage() {
  return (
    <EmptyState
      title="Fichas de treino"
      description="Aqui você gerenciará seus treinos A, B, C e os exercícios de cada ficha. O CRUD será implementado na próxima fase."
      icon={Dumbbell}
    />
  )
}
