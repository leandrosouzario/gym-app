-- =============================================================================
-- Migration: Gym App — fundação (tabelas gym_*)
-- Execute no Supabase Studio → SQL Editor (uma vez)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. gym_workout_plans — fichas de treino do usuário
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gym_workout_plans (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name        text        NOT NULL,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT gym_workout_plans_name_not_empty CHECK (char_length(trim(name)) > 0)
);

-- ---------------------------------------------------------------------------
-- 2. gym_workout_exercises — exercícios de cada ficha
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gym_workout_exercises (
  id             uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_plan_id uuid   NOT NULL REFERENCES public.gym_workout_plans (id) ON DELETE CASCADE,
  exercise_name  text    NOT NULL,
  sets           integer NOT NULL DEFAULT 3 CHECK (sets > 0),
  reps           integer NOT NULL DEFAULT 10 CHECK (reps > 0),
  target_weight  numeric(6, 2),
  notes          text,
  display_order  integer NOT NULL DEFAULT 0,
  CONSTRAINT gym_workout_exercises_name_not_empty CHECK (char_length(trim(exercise_name)) > 0)
);

-- ---------------------------------------------------------------------------
-- 3. gym_workout_sessions — sessões de treino realizadas
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gym_workout_sessions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  workout_plan_id uuid        REFERENCES public.gym_workout_plans (id) ON DELETE SET NULL,
  performed_at    timestamptz NOT NULL DEFAULT now(),
  notes           text
);

-- ---------------------------------------------------------------------------
-- 4. gym_exercise_logs — registros de exercício por sessão
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gym_exercise_logs (
  id                  uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_session_id  uuid    NOT NULL REFERENCES public.gym_workout_sessions (id) ON DELETE CASCADE,
  workout_exercise_id uuid    REFERENCES public.gym_workout_exercises (id) ON DELETE SET NULL,
  weight_used         numeric(6, 2),
  reps_completed      integer CHECK (reps_completed > 0),
  notes               text
);

-- ---------------------------------------------------------------------------
-- 5. gym_exercise_prs — recordes pessoais por exercício
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gym_exercise_prs (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  exercise_name text        NOT NULL,
  max_weight    numeric(6, 2),
  max_volume    numeric(10, 2),
  achieved_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT gym_exercise_prs_name_not_empty CHECK (char_length(trim(exercise_name)) > 0)
);

-- ---------------------------------------------------------------------------
-- 6. Índices
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS gym_workout_plans_user_id_idx
  ON public.gym_workout_plans (user_id);

CREATE INDEX IF NOT EXISTS gym_workout_exercises_plan_id_idx
  ON public.gym_workout_exercises (workout_plan_id, display_order);

CREATE INDEX IF NOT EXISTS gym_workout_sessions_user_id_idx
  ON public.gym_workout_sessions (user_id, performed_at DESC);

CREATE INDEX IF NOT EXISTS gym_exercise_logs_session_id_idx
  ON public.gym_exercise_logs (workout_session_id);

CREATE INDEX IF NOT EXISTS gym_exercise_prs_user_id_idx
  ON public.gym_exercise_prs (user_id, exercise_name);

-- ---------------------------------------------------------------------------
-- 7. Trigger: atualizar updated_at em gym_workout_plans
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.gym_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS gym_workout_plans_updated_at ON public.gym_workout_plans;
CREATE TRIGGER gym_workout_plans_updated_at
  BEFORE UPDATE ON public.gym_workout_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.gym_set_updated_at();

-- ---------------------------------------------------------------------------
-- 8. Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.gym_workout_plans    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_workout_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_exercise_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_exercise_prs      ENABLE ROW LEVEL SECURITY;

-- gym_workout_plans
DROP POLICY IF EXISTS "Users can manage own workout plans" ON public.gym_workout_plans;
CREATE POLICY "Users can manage own workout plans"
  ON public.gym_workout_plans
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- gym_workout_exercises (acesso via plano do usuário)
DROP POLICY IF EXISTS "Users can manage exercises of own plans" ON public.gym_workout_exercises;
CREATE POLICY "Users can manage exercises of own plans"
  ON public.gym_workout_exercises
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.gym_workout_plans p
      WHERE p.id = workout_plan_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.gym_workout_plans p
      WHERE p.id = workout_plan_id AND p.user_id = auth.uid()
    )
  );

-- gym_workout_sessions
DROP POLICY IF EXISTS "Users can manage own sessions" ON public.gym_workout_sessions;
CREATE POLICY "Users can manage own sessions"
  ON public.gym_workout_sessions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- gym_exercise_logs (acesso via sessão do usuário)
DROP POLICY IF EXISTS "Users can manage logs of own sessions" ON public.gym_exercise_logs;
CREATE POLICY "Users can manage logs of own sessions"
  ON public.gym_exercise_logs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.gym_workout_sessions s
      WHERE s.id = workout_session_id AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.gym_workout_sessions s
      WHERE s.id = workout_session_id AND s.user_id = auth.uid()
    )
  );

-- gym_exercise_prs
DROP POLICY IF EXISTS "Users can manage own PRs" ON public.gym_exercise_prs;
CREATE POLICY "Users can manage own PRs"
  ON public.gym_exercise_prs
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 9. Grants
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gym_workout_plans     TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gym_workout_exercises  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gym_workout_sessions   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gym_exercise_logs      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gym_exercise_prs       TO authenticated;
