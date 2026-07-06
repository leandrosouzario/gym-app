'use client'

import { useState } from 'react'
import { Menu, LogOut, User, Sun, Moon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { pageTitles } from '@/lib/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/components/theme/ThemeProvider'

const AUTH_PROFILE_URL = process.env.NEXT_PUBLIC_AUTH_PROFILE_URL ?? 'https://auth.leandrosouza.info/perfil'

type AppHeaderProps = {
  pathname: string
  userEmail?: string | null
  onMenuClick: () => void
}

export function AppHeader({ pathname, userEmail, onMenuClick }: AppHeaderProps) {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const [signingOut, setSigningOut] = useState(false)

  const title = pageTitles[pathname] ?? pageTitles[pathname.split('/').slice(0, 3).join('/')] ?? 'Gym App'
  const displayEmail = userEmail ?? 'Usuário'

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/90 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h1>
          <p className="text-xs text-gray-500 dark:text-slate-400">Gerenciamento de treinos</p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <div className="hidden text-right sm:block mr-2">
          <p className="text-sm font-medium text-gray-700 dark:text-slate-200 truncate max-w-[160px]">{displayEmail}</p>
          <p className="text-xs text-gray-400 dark:text-slate-500">Sessão ativa</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-semibold text-emerald-600 dark:text-emerald-300 shrink-0">
          {displayEmail.charAt(0).toUpperCase()}
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Mudar para claro' : 'Mudar para escuro'}
          className="rounded-lg p-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <a
          href={AUTH_PROFILE_URL}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-medium"
        >
          <User className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Perfil</span>
        </a>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-medium disabled:opacity-50"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">{signingOut ? 'Saindo...' : 'Sair'}</span>
        </button>
      </div>
    </header>
  )
}
