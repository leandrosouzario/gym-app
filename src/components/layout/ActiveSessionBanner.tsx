'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Play, ArrowRight } from 'lucide-react'

type ActiveSession = {
  id: string
  plan_name_snapshot: string | null
  performed_at: string
}

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export function ActiveSessionBanner({ session }: { session: ActiveSession }) {
  const [elapsed, setElapsed] = useState(
    Date.now() - new Date(session.performed_at).getTime()
  )

  useEffect(() => {
    const id = setInterval(
      () => setElapsed(Date.now() - new Date(session.performed_at).getTime()),
      1000
    )
    return () => clearInterval(id)
  }, [session.performed_at])

  return (
    <Link
      href={`/sessao/${session.id}`}
      className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 transition-colors hover:bg-emerald-100 dark:hover:bg-emerald-950/50"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
          <Play className="h-3.5 w-3.5 fill-current translate-x-px" />
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
            Treino em andamento
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 tabular-nums">
            {session.plan_name_snapshot ?? 'Treino livre'} · {formatElapsed(elapsed)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 text-sm font-medium text-emerald-700 dark:text-emerald-300 shrink-0">
        Retomar
        <ArrowRight className="h-4 w-4" />
      </div>
    </Link>
  )
}
