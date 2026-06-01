-- Migration: Store AxonIQ marketing quiz funnel sessions
-- Path: supabase/migrations/20260531_quiz_funnel_sessions.sql

CREATE TABLE IF NOT EXISTS public.quiz_funnel_sessions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  lead_name text,
  lead_email text,
  lead_phone text,
  current_step integer NOT NULL DEFAULT 0,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  events jsonb NOT NULL DEFAULT '[]'::jsonb,
  result_profile text,
  utm jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_url text,
  user_agent text,
  ip_address inet,
  checkout_plan text,
  checkout_clicked_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_funnel_sessions ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS on_quiz_funnel_sessions_updated ON public.quiz_funnel_sessions;
CREATE TRIGGER on_quiz_funnel_sessions_updated
  BEFORE UPDATE ON public.quiz_funnel_sessions
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_quiz_funnel_sessions_created_at
  ON public.quiz_funnel_sessions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_quiz_funnel_sessions_lead_email
  ON public.quiz_funnel_sessions (lead_email);

