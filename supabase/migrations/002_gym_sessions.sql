-- =============================================================================
-- Migration 002: Gym App — sessões set-level, tema e configurações
-- Execute no Supabase Studio → SQL Editor (uma vez, após migration 001)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Alterações em gym_workout_exercises
-- ---------------------------------------------------------------------------
ALTER TABLE public.gym_workout_exercises
  ADD COLUMN IF NOT EXISTS weight_type    text    NOT NULL DEFAULT 'kg'
    CONSTRAINT gym_workout_exercises_weight_type_check CHECK (weight_type IN ('kg', 'plates')),
  ADD COLUMN IF NOT EXISTS weight_per_side boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rest_seconds   integer;

-- ---------------------------------------------------------------------------
-- 2. Alterações em gym_workout_sessions
-- ---------------------------------------------------------------------------
ALTER TABLE public.gym_workout_sessions
  ADD COLUMN IF NOT EXISTS status            text        NOT NULL DEFAULT 'completed'
    CONSTRAINT gym_workout_sessions_status_check CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  ADD COLUMN IF NOT EXISTS ended_at          timestamptz,
  ADD COLUMN IF NOT EXISTS plan_name_snapshot text;

-- Registros existentes: started_at = performed_at, ended_at = performed_at
UPDATE public.gym_workout_sessions
  SET ended_at = performed_at
  WHERE ended_at IS NULL;

-- ---------------------------------------------------------------------------
-- 3. gym_session_exercises — exercícios de uma sessão (clone da ficha)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gym_session_exercises (
  id                uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        uuid    NOT NULL REFERENCES public.gym_workout_sessions (id) ON DELETE CASCADE,
  plan_exercise_id  uuid    REFERENCES public.gym_workout_exercises (id) ON DELETE SET NULL,
  exercise_name     text    NOT NULL,
  weight_type       text    NOT NULL DEFAULT 'kg'
    CONSTRAINT gym_session_exercises_weight_type_check CHECK (weight_type IN ('kg', 'plates')),
  weight_per_side   boolean NOT NULL DEFAULT false,
  display_order     integer NOT NULL DEFAULT 0,
  notes             text,
  CONSTRAINT gym_session_exercises_name_not_empty CHECK (char_length(trim(exercise_name)) > 0)
);

-- ---------------------------------------------------------------------------
-- 4. gym_session_sets — séries de cada exercício na sessão
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gym_session_sets (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_exercise_id   uuid        NOT NULL REFERENCES public.gym_session_exercises (id) ON DELETE CASCADE,
  set_number            integer     NOT NULL CHECK (set_number > 0),
  set_type              text        NOT NULL DEFAULT 'normal'
    CONSTRAINT gym_session_sets_type_check CHECK (set_type IN ('warmup', 'normal', 'dropset', 'failure')),
  weight_value          numeric(8, 2),
  reps                  integer     CHECK (reps > 0),
  completed_at          timestamptz,
  notes                 text,
  UNIQUE (session_exercise_id, set_number)
);

-- ---------------------------------------------------------------------------
-- 5. gym_user_settings — preferências do usuário
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gym_user_settings (
  user_id       uuid        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  weekly_goal   integer     NOT NULL DEFAULT 3 CHECK (weekly_goal BETWEEN 1 AND 7),
  theme         text        NOT NULL DEFAULT 'light'
    CONSTRAINT gym_user_settings_theme_check CHECK (theme IN ('light', 'dark')),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 6. Índices
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS gym_session_exercises_session_id_idx
  ON public.gym_session_exercises (session_id, display_order);

CREATE INDEX IF NOT EXISTS gym_session_sets_exercise_id_idx
  ON public.gym_session_sets (session_exercise_id, set_number);

CREATE INDEX IF NOT EXISTS gym_workout_sessions_status_idx
  ON public.gym_workout_sessions (user_id, status, performed_at DESC);

-- ---------------------------------------------------------------------------
-- 7. Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.gym_session_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_session_sets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_user_settings     ENABLE ROW LEVEL SECURITY;

-- gym_session_exercises: acesso via sessão do usuário
DROP POLICY IF EXISTS "Users can manage own session exercises" ON public.gym_session_exercises;
CREATE POLICY "Users can manage own session exercises"
  ON public.gym_session_exercises
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.gym_workout_sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.gym_workout_sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

-- gym_session_sets: acesso via session_exercise → sessão do usuário
DROP POLICY IF EXISTS "Users can manage own session sets" ON public.gym_session_sets;
CREATE POLICY "Users can manage own session sets"
  ON public.gym_session_sets
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.gym_session_exercises se
      JOIN public.gym_workout_sessions s ON s.id = se.session_id
      WHERE se.id = session_exercise_id AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.gym_session_exercises se
      JOIN public.gym_workout_sessions s ON s.id = se.session_id
      WHERE se.id = session_exercise_id AND s.user_id = auth.uid()
    )
  );

-- gym_user_settings
DROP POLICY IF EXISTS "Users can manage own settings" ON public.gym_user_settings;
CREATE POLICY "Users can manage own settings"
  ON public.gym_user_settings
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 8. Grants
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gym_session_exercises TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gym_session_sets      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gym_user_settings     TO authenticated;
