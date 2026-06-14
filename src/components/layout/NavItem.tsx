'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { NavItem } from '@/lib/navigation'

type NavItemLinkProps = {
  item: NavItem
  onNavigate?: () => void
}

export function NavItemLink({ item, onNavigate }: NavItemLinkProps) {
  const pathname = usePathname()
  const isActive =
    pathname === item.href || pathname.startsWith(`${item.href}/`)
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        isActive
          ? 'bg-emerald-500/15 text-emerald-300'
          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      <span>{item.label}</span>
    </Link>
  )
}
