import type { LucideIcon } from 'lucide-react'

type EmptyStateProps = {
  title: string
  description: string
  icon: LucideIcon
}

export function EmptyState({ title, description, icon: Icon }: EmptyStateProps) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900/40 px-6 py-12 text-center">
      <div className="mb-4 rounded-full bg-slate-800 p-4">
        <Icon className="h-8 w-8 text-slate-400" aria-hidden="true" />
      </div>
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-slate-400">{description}</p>
    </div>
  )
}
