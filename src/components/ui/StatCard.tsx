import type { LucideIcon } from 'lucide-react'

type StatCardProps = {
  title: string
  value: string
  description: string
  icon: LucideIcon
  trend?: string
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: StatCardProps) {
  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
            {value}
          </p>
          <p className="mt-2 text-sm text-slate-400">{description}</p>
        </div>
        <div className="rounded-lg bg-emerald-500/10 p-3">
          <Icon className="h-5 w-5 text-emerald-400" aria-hidden="true" />
        </div>
      </div>
      {trend ? (
        <p className="mt-4 text-xs font-medium text-emerald-400">{trend}</p>
      ) : null}
    </article>
  )
}
