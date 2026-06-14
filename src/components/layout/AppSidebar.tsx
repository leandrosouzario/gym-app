'use client'

import { Dumbbell, X } from 'lucide-react'
import { mainNavigation } from '@/lib/navigation'
import { NavItemLink } from './NavItem'

type AppSidebarProps = {
  open: boolean
  onClose: () => void
}

export function AppSidebar({ open, onClose }: AppSidebarProps) {
  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm transition-opacity lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800 bg-slate-900 transition-transform lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15">
              <Dumbbell className="h-5 w-5 text-emerald-400" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Gym App</p>
              <p className="text-xs text-slate-400">Treinos</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {mainNavigation.map((item) => (
            <NavItemLink key={item.href} item={item} onNavigate={onClose} />
          ))}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <p className="text-xs text-slate-500">Fase 1 — Fundação</p>
        </div>
      </aside>
    </>
  )
}
