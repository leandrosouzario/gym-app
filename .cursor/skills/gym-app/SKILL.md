---
name: gym-app
description: >-
  Desenvolve o gym-app (gym.leandrosouza.info): CRUD de fichas de treino,
  registro de sessões, evolução de carga. TypeScript + Supabase SSR.
---

# Gym App

## Nova página autenticada

1. Criar `src/app/(app)/<rota>/page.tsx`
2. Adicionar entrada em `mainNavigation` em `src/lib/navigation.ts`
3. Adicionar label em `pageTitles` em `src/lib/navigation.ts`
4. Se rota nova precisa de proteção → adicionar path em `PROTECTED_PREFIXES` em `src/lib/supabase/middleware.ts`

## Novo tipo de dado (tabela Supabase)

1. Definir tipos em `src/types/database.ts` (Insert, Update, tipo base)
2. Criar migration SQL em `supabase/migrations/<N>_gym_<nome>.sql`:
   - Prefixo `gym_` no nome da tabela
   - `user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE`
   - RLS habilitada: políticas `SELECT`/`INSERT`/`UPDATE`/`DELETE` para `authenticated` com `auth.uid() = user_id`
3. Executar migration no Supabase Studio → SQL Editor

## Consumir dados do Supabase

```typescript
// Server Component
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
const { data, error } = await supabase
  .from('gym_workout_plans')
  .select('*')
  .eq('user_id', user.id)
```

## Redirect de auth (padrão correto)

```typescript
// Em src/lib/supabase/middleware.ts
const returnTo = new URL(request.nextUrl.pathname, process.env.NEXT_PUBLIC_SITE_URL!).toString()
const loginUrl = new URL(process.env.NEXT_PUBLIC_AUTH_LOGIN_URL!)
loginUrl.searchParams.set('next', returnTo)
return NextResponse.redirect(loginUrl)
```

## Ícone PWA

Editar `public/icons/icon.svg` → rebuild Docker:
```bash
docker compose build --no-cache && docker compose up -d
```

Ver [AGENTS.md](../../AGENTS.md).
