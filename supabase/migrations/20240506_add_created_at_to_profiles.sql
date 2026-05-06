-- Migration: Add created_at to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Optional: Populate existing profiles with updated_at as a fallback
UPDATE public.profiles 
SET created_at = updated_at 
WHERE created_at IS NULL;
