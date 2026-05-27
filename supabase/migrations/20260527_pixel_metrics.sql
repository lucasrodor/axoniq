-- Migration: Create pixel_events_metrics table to track client-side marketing events by date (idempotent version)
-- Path: supabase/migrations/20260527_pixel_metrics.sql

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.pixel_events_metrics (
    event_name text NOT NULL,
    event_date date NOT NULL DEFAULT CURRENT_DATE,
    count bigint NOT NULL DEFAULT 0,
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (event_name, event_date)
);

-- 2. Enable RLS (Row Level Security)
ALTER TABLE public.pixel_events_metrics ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies safely by dropping them first if they exist
DROP POLICY IF EXISTS "Allow service role full access" ON public.pixel_events_metrics;
CREATE POLICY "Allow service role full access" ON public.pixel_events_metrics
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to read metrics" ON public.pixel_events_metrics;
CREATE POLICY "Allow authenticated users to read metrics" ON public.pixel_events_metrics
    FOR SELECT
    TO authenticated
    USING (true);

-- 4. Create or replace RPC function to increment event counts safely
CREATE OR REPLACE FUNCTION public.increment_pixel_event(event_name_param text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.pixel_events_metrics (event_name, event_date, count, updated_at)
  VALUES (event_name_param, CURRENT_DATE, 1, now())
  ON CONFLICT (event_name, event_date)
  DO UPDATE SET count = public.pixel_events_metrics.count + 1, updated_at = now();
END;
$$;
