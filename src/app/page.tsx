import Link from 'next/link'
import { Dumbbell, BarChart2, History, Zap } from 'lucide-react'

const AUTH_LOGIN_URL = process.env.NEXT_PUBLIC_AUTH_LOGIN_URL ?? 'https://auth.leandrosouza.info/login'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gym.leandrosouza.info'

const features = [
  {
    icon: Dumbbell,
    title: 'Fichas organizadas',
    description:
      'Monte suas fichas de treino com exercícios, séries, repetições e peso-alvo. Crie quantas fichas quiser — Treino A, B, C.',
  },
  {
    icon: Zap,
    title: 'Registro rápido de séries',
    description:
      'Na academia, marque cada série com um toque. Peso e reps pré-preenchidos com base no seu último treino.',
  },
  {
    icon: History,
    title: 'Histórico e recordes',
    description:
      'Acompanhe todas as suas sessões. O app detecta automaticamente quando você bate um recorde pessoal.',
  },
  {
    icon: BarChart2,
    title: 'Acompanhe sua evolução',
    description:
      'Visualize seu progresso ao longo do tempo: cargas, volume e consistência. Continue crescendo.',
  },
]

export default function LandingPage() {
  const loginUrl = `${AUTH_LOGIN_URL}?next=${encodeURIComponent(SITE_URL + '/dashboard')}`
  const signupUrl = `${AUTH_LOGIN_URL}?next=${encodeURIComponent(SITE_URL + '/dashboard')}`

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15">
              <Dumbbell className="h-5 w-5 text-emerald-500" />
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">Gym App</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={loginUrl}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Entrar
            </a>
            <a
              href={signupUrl}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
            >
              Criar conta
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-24">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
          <Dumbbell className="h-4 w-4" />
          Sua ficha de musculação digital
        </div>
        <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
          Academia mais inteligente,
          <br />
          <span className="text-emerald-500">treino mais eficiente.</span>
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-600 dark:text-slate-400">
          Monte suas fichas, registre cada série na academia com um toque e acompanhe seus
          recordes pessoais e evolução de carga ao longo do tempo.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a
            href={signupUrl}
            className="w-full rounded-xl bg-emerald-500 px-8 py-3.5 text-base font-bold text-white hover:bg-emerald-600 transition-colors sm:w-auto"
          >
            Começar gratuitamente
          </a>
          <a
            href={loginUrl}
            className="w-full rounded-xl border border-gray-300 dark:border-slate-700 px-8 py-3.5 text-base font-medium text-gray-700 dark:text-slate-300 hover:border-gray-400 dark:hover:border-slate-600 transition-colors sm:w-auto"
          >
            Já tenho conta
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15">
                  <Icon className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-slate-800 py-6 text-center text-sm text-gray-400 dark:text-slate-500">
        © {new Date().getFullYear()} Leandro Souza · Gym App
      </footer>
    </div>
  )
}
