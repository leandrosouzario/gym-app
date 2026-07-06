# Gym App — Agent Guide

Aplicação web para gerenciamento de fichas de musculação em `https://gym.leandrosouza.info`.

## Escopo

- CRUD de fichas de treino (`/treinos`)
- Registro de sessões de treino (`/historico`)
- Acompanhamento de evolução e PRs de carga (`/evolucao`)
- Dashboard com resumo de estatísticas (`/dashboard`)
- Layout shell (sidebar + header) em `src/components/layout/`

**Fora de escopo:** autenticação própria (login/cadastro/reset), tabela `profiles`, lógica de outras apps.

## Stack

Next.js 16 · React 18 · Tailwind · **TypeScript** · Supabase SSR · Lucide React · porta **3020** · Docker `3020:3020`

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
    dashboard/      # DashboardStats (mock → dados reais futuros)
  lib/
    navigation.ts   # mainNavigation, pageTitles
    pwa-icons.ts    # PWA_ICON_VERSION, PWA_MANIFEST_ICONS
    supabase/       # client.ts, server.ts, middleware.ts, cookie-options.ts
  types/
    database.ts     # tipos das tabelas gym_* (GymWorkoutPlan, GymWorkoutExercise, etc.)
    index.ts
  middleware.ts     # updateSession — protege /dashboard /treinos /historico /evolucao
scripts/
  generate-icons.mjs  # gera PNGs a partir de public/icons/icon.svg
supabase/
  migrations/       # SQLs das tabelas gym_* (criar se ainda não existir)
public/
  icons/            # icon.svg + PNGs gerados no build Docker
```

## Modelo de dados (Supabase)

Tabelas no schema `public`, todas com prefixo `gym_`:

| Tabela | Descrição |
|---|---|
| `gym_workout_plans` | Fichas de treino do usuário |
| `gym_workout_exercises` | Exercícios de cada ficha (com `display_order`) |
| `gym_workout_sessions` | Sessões realizadas |
| `gym_exercise_logs` | Registros por exercício numa sessão |
| `gym_exercise_prs` | Recordes pessoais por exercício |

Tipos TypeScript em `src/types/database.ts`. Migrations SQL devem ficar em `supabase/migrations/`.

## Autenticação

- **Sem login próprio.** O gym-app delega ao provedor central de auth (`NEXT_PUBLIC_AUTH_LOGIN_URL`).
- Middleware protege rotas com: sem sessão → redirect para `AUTH_LOGIN_URL?next=<URL absoluta do gym>`.
- Usar sempre **URL absoluta** no parâmetro `next` (ex.: `https://gym.leandrosouza.info/dashboard`), nunca path relativo.
- Cookies de sessão no domínio `.leandrosouza.info` — compartilhados entre apps.
- Dados do usuário: ler `auth.getUser()` via Supabase SSR. Perfil em `public.profiles` (gerenciado pelo pc-app).

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Sim | URL canônica do gym (ex.: `https://gym.leandrosouza.info`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | URL do Supabase self-hosted |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sim | Chave anon do Supabase |
| `NEXT_PUBLIC_AUTH_LOGIN_URL` | Sim | URL de login do provedor central (ex.: `https://hub.leandrosouza.info/login`) |

`NEXT_PUBLIC_APP_URL` no `.env` atual é duplicata de `SITE_URL` — ignorar, usar `SITE_URL`.

## Convenções de código

- TypeScript obrigatório. Sem JavaScript/JSX puro.
- Server Components por padrão; `'use client'` só quando necessário.
- Imports com alias `@/` (configurado em `tsconfig.json`).
- UI em pt-BR; paleta slate + emerald.
- Novos tipos de dado → `src/types/database.ts`.
- Nova rota autenticada → adicionar em `PROTECTED_PREFIXES` no `src/lib/supabase/middleware.ts`.

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
| PC / Auth | `https://pc.leandrosouza.info` | Provedor de auth atual; alvo do `AUTH_LOGIN_URL` |
| Balcão | `https://balcao.leandrosouza.info` | App irmã, mesmo Supabase |
| Supabase | `https://supabase.leandrosouza.info` | Backend compartilhado |

## Git

`git@github.com:leandrosouzario/gym-app.git` · branch `main`
