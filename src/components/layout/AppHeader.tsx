'use client'

import { Menu } from 'lucide-react'
import { pageTitles } from '@/lib/navigation'

type AppHeaderProps = {
  pathname: string
  userEmail?: string | null
  onMenuClick: () => void
}

export function AppHeader({
  pathname,
  userEmail,
  onMenuClick,
}: AppHeaderProps) {
  const title = pageTitles[pathname] ?? 'Gym App'
  const displayEmail = userEmail ?? 'Usuário autenticado'

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-white">{title}</h1>
          <p className="text-xs text-slate-400">Gerenciamento de treinos</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-slate-200">{displayEmail}</p>
          <p className="text-xs text-slate-500">Sessão ativa</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-semibold text-emerald-300">
          {displayEmail.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  )
}
