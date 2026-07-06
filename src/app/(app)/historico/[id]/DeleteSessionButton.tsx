'use client'

import { Trash2 } from 'lucide-react'
import { deleteSession } from '@/features/sessao/actions'

export function DeleteSessionButton({ sessionId }: { sessionId: string }) {
  return (
    <form
      action={deleteSession.bind(null, sessionId)}
      onSubmit={(e) => {
        if (!confirm('Excluir esta sessão? Esta ação não pode ser desfeita.'))
          e.preventDefault()
      }}
    >
      <button
        type="submit"
        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
      >
        <Trash2 className="h-4 w-4" />
        <span className="hidden sm:inline">Excluir</span>
      </button>
    </form>
  )
}
