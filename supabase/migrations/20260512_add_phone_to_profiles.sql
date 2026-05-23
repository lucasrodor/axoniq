-- Migration: Add phone column to profiles table and update auth sync trigger
-- Path: supabase/migrations/20260512_add_phone_to_profiles.sql

-- 1. Add phone column to public.profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone text;

-- 2. Create or replace function to automatically sync new auth.users to public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, phone, created_at, updated_at)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'phone',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    updated_at = now();
  RETURN NEW;
END;
$$;

-- 3. Ensure trigger is attached to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
