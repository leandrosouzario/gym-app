# Gym App

Aplicação para gerenciamento de fichas de treino, registro de sessões e evolução de carga.

**URL de produção:** `https://gym.leandrosouza.info`  
**Porta local:** 3020

## Stack

Next.js 16 · React 18 · Tailwind · TypeScript · Supabase SSR · Recharts

## Funcionalidades

- **Fichas de treino:** crie fichas com exercícios, pesos (kg ou placas) e repetições
- **Sessão de treino:** inicie, registre série a série, com prefill do plano e detecção de PR
- **Histórico:** veja todas as sessões concluídas com detalhes
- **Evolução:** gráficos de progressão por exercício, heatmap de consistência, tabela de recordes
- **Tema claro/escuro** persistido por usuário
- **Landing page pública** para não logados

## Pré-requisitos

- Docker e Docker Compose

## Build e execução (Docker)

```bash
cp .env.example .env   # preencha as variáveis
docker compose build --no-cache
docker compose up -d
```

Aplicação disponível em `http://localhost:3020`.

## Variáveis de ambiente

| Variável | Obrigatória | Descrição | Exemplo |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Sim | URL canônica desta app | `https://gym.leandrosouza.info` |
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | URL do Supabase self-hosted | `https://supabase.leandrosouza.info` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sim | Chave anon do Supabase | `eyJ...` |
| `NEXT_PUBLIC_AUTH_LOGIN_URL` | Sim | URL de login do provedor central | `https://auth.leandrosouza.info/login` |
| `NEXT_PUBLIC_AUTH_PROFILE_URL` | Sim | URL de perfil do provedor central | `https://auth.leandrosouza.info/perfil` |

## Migrations Supabase

Execute no Supabase Studio → SQL Editor, **em ordem**:

1. `supabase/migrations/001_gym_foundation.sql` — tabelas base (`gym_workout_plans`, `gym_workout_exercises`, `gym_workout_sessions`, `gym_exercise_prs`) com RLS
2. `supabase/migrations/002_gym_sessions.sql` — logging por série (`gym_session_exercises`, `gym_session_sets`), preferências do usuário (`gym_user_settings`), status de sessão

## Ícones PWA (iPhone / Tela de Início)

Os PNGs são gerados automaticamente no **build Docker** a partir de `public/icons/icon.svg`.

Para alterar o ícone, edite o SVG e rebuild.

## Estrutura

```
src/
  app/
    page.tsx              # landing page pública
    (app)/                # rotas autenticadas
    (session)/            # layout de sessão ativa
  components/
    charts/               # ExerciseProgressChart, ConsistencyBarChart, WeeklyHeatmap, ExercisePicker
    layout/               # AppShell, AppHeader, AppSidebar, NavItem
    theme/                # ThemeProvider
  features/
    dashboard/            # queries, DashboardStats
    treinos/              # queries, actions
    sessao/               # queries, actions
    historico/            # queries
    evolucao/             # queries, actions
    settings/             # actions (tema)
  lib/
    supabase/             # client, server, middleware, cookie-options
    theme.ts / navigation.ts / pwa-icons.ts
  types/
    database.ts           # tipos das tabelas gym_*
  middleware.ts
scripts/
  generate-icons.mjs
supabase/
  migrations/
```

## Cloudflare Tunnel

```yaml
- hostname: gym.leandrosouza.info
  service: http://localhost:3020
```

## Git

`git@github.com:leandrosouzario/gym-app.git` · branch `main`
