import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Gym App — Gerenciamento de Treinos',
  description:
    'Aplicação para gerenciamento de fichas de treino, registro de sessões e evolução de carga.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-950 text-slate-100 antialiased">{children}</body>
    </html>
  )
}
