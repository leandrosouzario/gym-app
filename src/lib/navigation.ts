import type { LucideIcon } from 'lucide-react'
import { Dumbbell, History, LayoutDashboard, TrendingUp } from 'lucide-react'

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
}

export const mainNavigation: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Treinos', href: '/treinos', icon: Dumbbell },
  { label: 'Histórico', href: '/historico', icon: History },
  { label: 'Evolução', href: '/evolucao', icon: TrendingUp },
]

export const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/treinos': 'Treinos',
  '/treinos/nova': 'Nova Ficha',
  '/historico': 'Histórico',
  '/evolucao': 'Evolução',
  '/sessao': 'Sessão de Treino',
}
