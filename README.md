# Gym App

Aplicação para gerenciamento de fichas de treino, registro de sessões e evolução de carga.

**URL de produção:** `https://gym.leandrosouza.info`  
**Porta local:** 3020

## Stack

Next.js 16 · React 18 · Tailwind · TypeScript · Supabase SSR

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
| `NEXT_PUBLIC_AUTH_LOGIN_URL` | Sim | URL de login do provedor central | `https://pc.leandrosouza.info/login` |

> `NEXT_PUBLIC_APP_URL` presente no `.env` é duplicata de `SITE_URL` — pode ser ignorado.

## Migrations Supabase

Execute no Supabase Studio → SQL Editor. Os arquivos SQL ficam em `supabase/migrations/`:

1. `001_gym_foundation.sql` — tabelas `gym_workout_plans`, `gym_workout_exercises`, `gym_workout_sessions`, `gym_exercise_logs`, `gym_exercise_prs` com RLS

## Ícones PWA (iPhone / Tela de Início)

Os PNGs são gerados automaticamente no **build Docker** a partir de `public/icons/icon.svg`.

Para alterar o ícone, edite o SVG e rebuild:

```bash
docker compose build --no-cache
docker compose up -d
```

## Estrutura

```
src/
  app/
    (app)/          # rotas autenticadas (dashboard, treinos, historico, evolucao)
    layout.tsx      # root layout com metadata PWA
    manifest.ts     # Web App Manifest
    page.tsx        # redirect → /dashboard
  components/
    layout/         # AppShell, AppHeader, AppSidebar, NavItem
    ui/             # EmptyState, StatCard
  features/
    dashboard/      # DashboardStats
  lib/
    navigation.ts   # rotas e títulos
    pwa-icons.ts
    supabase/       # client, server, middleware, cookie-options
  types/
    database.ts     # tipos das tabelas gym_*
  middleware.ts     # protege /dashboard /treinos /historico /evolucao
scripts/
  generate-icons.mjs
supabase/
  migrations/       # SQLs das tabelas gym_*
public/
  icons/            # icon.svg + PNGs gerados no build
```

## Escopo

- CRUD de fichas de treino, exercícios, sessões e evolução de carga.
- Sem autenticação própria — login delegado ao provedor central (`AUTH_LOGIN_URL`).
- Dados do usuário: tabelas `gym_*` no Supabase compartilhado.

## Desenvolvimento local (opcional)

Requer Node.js 18+ na máquina:

```bash
npm install
npm run dev
```

## Cloudflare Tunnel

```yaml
- hostname: gym.leandrosouza.info
  service: http://192.168.68.245:3020
```

## Git

`git@github.com:leandrosouzario/gym-app.git` · branch `main`
