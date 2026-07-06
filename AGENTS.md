# Gym App — Agent Guide

Aplicação web para gerenciamento de fichas de musculação em `https://gym.leandrosouza.info`.

## Escopo

- Landing page pública com apresentação do app (`/`)
- CRUD de fichas de treino com exercícios (`/treinos`, `/treinos/nova`, `/treinos/[id]`)
- Sessão de treino ativa com logging por série, prefill e PR detection (`/sessao/[id]`)
- Histórico de sessões concluídas (`/historico`, `/historico/[id]`)
- Dashboard com stats reais: treinos da semana, meta, último treino, PRs (`/dashboard`)
- Evolução: gráficos de progressão por exercício, heatmap de consistência, tabela de PRs (`/evolucao`)
- Tema claro/escuro persistido por usuário

**Fora de escopo:** autenticação própria (login/cadastro/reset), tabela `profiles`, lógica de outras apps.

## Stack

Next.js 16 · React 18 · Tailwind · **TypeScript** · Supabase SSR · Lucide React · **Recharts** · porta **3020** · Docker `3020:3020`

## Estrutura

```
src/
  app/
    page.tsx                  # landing page pública (redireciona logados para /dashboard)
    layout.tsx                # root layout com metadata PWA + leitura de cookie de tema
    (app)/                    # rotas autenticadas
      layout.tsx              # ThemeProvider + sessão
      dashboard/page.tsx
      treinos/page.tsx
      treinos/nova/page.tsx
      treinos/[id]/page.tsx
      treinos/[id]/PlanEditor.tsx   # Client Component: edição de exercícios
      historico/page.tsx
      historico/[id]/page.tsx
      historico/[id]/DeleteSessionButton.tsx  # Client Component
      evolucao/page.tsx
      evolucao/EvolucaoClient.tsx   # Client Component: tabs + estado dos 3 slots
    (session)/                # layout de sessão ativa
      layout.tsx
      sessao/[id]/page.tsx
      sessao/[id]/SessionClient.tsx # Client Component: logging por série, timers, PR toasts
  components/
    layout/                   # AppShell, AppHeader, AppSidebar, NavItem
    charts/                   # ExerciseProgressChart, ConsistencyBarChart, WeeklyHeatmap, ExercisePicker
    theme/                    # ThemeProvider
    ui/                       # EmptyState, StatCard
  features/
    dashboard/                # queries.ts, components/DashboardStats.tsx
    treinos/                  # queries.ts, actions.ts
    sessao/                   # queries.ts, actions.ts
    historico/                # queries.ts
    evolucao/                 # queries.ts, actions.ts
    settings/                 # actions.ts (updateTheme)
  lib/
    navigation.ts             # mainNavigation, pageTitles
    theme.ts                  # applyTheme, persistTheme
    pwa-icons.ts
    supabase/                 # client.ts, server.ts, middleware.ts, cookie-options.ts
  types/
    database.ts               # GymWorkoutPlan, GymWorkoutExercise, GymSession*, GymExercisePr, etc.
    index.ts
  middleware.ts               # protege /dashboard /treinos /historico /evolucao /sessao
scripts/
  generate-icons.mjs
supabase/
  migrations/                 # SQLs das tabelas gym_* (executar em ordem)
public/
  icons/                      # icon.svg + PNGs gerados no build Docker
```

## Modelo de dados (Supabase)

Tabelas no schema `public`, todas com prefixo `gym_`:

| Tabela | Descrição |
|---|---|
| `gym_workout_plans` | Fichas de treino do usuário |
| `gym_workout_exercises` | Exercícios de cada ficha (`weight_type`: kg/plates, `weight_per_side`) |
| `gym_workout_sessions` | Sessões realizadas (`status`: in_progress / completed / cancelled) |
| `gym_session_exercises` | Exercícios de cada sessão (snapshot do plano) |
| `gym_session_sets` | Séries individuais: `weight_value`, `reps`, `completed_at` |
| `gym_exercise_prs` | Recordes pessoais: `max_weight`, `max_volume`, `achieved_at` |
| `gym_user_settings` | Preferências: `theme`, `weekly_goal` |

Tipos TypeScript em `src/types/database.ts`. Migrations SQL em `supabase/migrations/`.

### Migrations (ordem obrigatória)

```
001_gym_foundation.sql    # tabelas base, RLS, triggers
002_gym_sessions.sql      # gym_session_exercises, gym_session_sets, gym_user_settings,
                          # coluna weight_type em gym_workout_exercises,
                          # coluna status em gym_workout_sessions
```

## Autenticação

- **Sem login próprio.** Delega ao provedor central (`NEXT_PUBLIC_AUTH_LOGIN_URL`).
- Middleware protege rotas: sem sessão → redirect para `AUTH_LOGIN_URL?next=<URL absoluta do gym>`.
- Usar sempre **URL absoluta** no parâmetro `next` (ex.: `https://gym.leandrosouza.info/dashboard`).
- Cookies de sessão no domínio `.leandrosouza.info` — compartilhados entre apps.
- Perfil do usuário: gerenciado pelo `auth-app` (`public.profiles`).

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Sim | `https://gym.leandrosouza.info` |
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | URL do Supabase self-hosted |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sim | Chave anon do Supabase |
| `NEXT_PUBLIC_AUTH_LOGIN_URL` | Sim | `https://auth.leandrosouza.info/login` |
| `NEXT_PUBLIC_AUTH_PROFILE_URL` | Sim | `https://auth.leandrosouza.info/perfil` |

## Funcionalidades principais

### Sessão de treino (`/sessao/[id]`)
- Pré-preenche séries com valores do plano (peso-alvo e reps)
- Logging por série: marcar cada série com peso e reps efetivos
- Detecção de PR: ao completar uma série, checa e registra PR automaticamente
- Botão "Marcar todos": completa todas as séries pendentes de um exercício de uma vez
- Cronômetro de sessão
- Cancelar ou finalizar sessão

### Evolução (`/evolucao`)
- **Aba Exercícios:** 3 gráficos de linha (últimos exercícios treinados), pontos dourados em PRs, botão "Trocar" com combobox pesquisável
- **Aba Consistência:** heatmap de 16 semanas + gráfico de barras (12 semanas) + streaks
- **Aba Recordes:** tabela pesquisável de todos os PRs com data

## Convenções de código

- TypeScript obrigatório. Sem JavaScript/JSX puro.
- Server Components por padrão; `'use client'` só quando necessário.
- Imports com alias `@/` (configurado em `tsconfig.json`).
- UI em pt-BR; paleta slate + emerald.
- Novos tipos de dado → `src/types/database.ts`.
- Nova rota autenticada → adicionar em `PROTECTED_PREFIXES` no `src/lib/supabase/middleware.ts`.
- Gráficos → usar Recharts com padrão já estabelecido em `src/components/charts/`.

## Deploy

```bash
docker compose build --no-cache
docker compose up -d
```

Cloudflare Tunnel: `gym.leandrosouza.info` → host `:3020`

## Apps do ecossistema

| App | URL | Relação |
|---|---|---|
| Hub | `https://hub.leandrosouza.info` | Catálogo público; lista o gym-app |
| Auth | `https://auth.leandrosouza.info` | Provedor de auth; perfil do usuário |
| Balcão | `https://balcao.leandrosouza.info` | App irmã, mesmo Supabase |
| Supabase | `https://supabase.leandrosouza.info` | Backend compartilhado |

## Git

`git@github.com:leandrosouzario/gym-app.git` · branch `main`
