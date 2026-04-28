-- Migration: Fix missing columns and add updated_at to sources/flashcards
-- Path: supabase/migrations/20260428_fix_schemas.sql

-- 1. Add explanation to flashcards if missing
ALTER TABLE public.flashcards 
ADD COLUMN IF NOT EXISTS explanation TEXT;

-- 2. Add updated_at to sources and flashcards
ALTER TABLE public.sources 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

ALTER TABLE public.flashcards 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- 3. Create/Update trigger for sources
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'on_sources_updated'
    ) THEN
        CREATE TRIGGER on_sources_updated 
        BEFORE UPDATE ON public.sources 
        FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
    END IF;
END $$;

-- 4. Create/Update trigger for flashcards
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'on_flashcards_updated'
    ) THEN
        CREATE TRIGGER on_flashcards_updated 
        BEFORE UPDATE ON public.flashcards 
        FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
    END IF;
END $$;
