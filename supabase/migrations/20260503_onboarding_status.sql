-- Migration: Add onboarding status to profiles
-- Tracks if a user has completed the guided tour to ensure it only shows once per account.
-- Path: supabase/migrations/20260503_onboarding_status.sql

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_completed_tour BOOLEAN DEFAULT false;

-- Grant access to authenticated users to update their own onboarding status
-- Policy for viewing is already covered by "Public profiles are viewable by everyone" or similar.
-- But we need to ensure users can update this specific field.

-- The existing policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);
-- should already cover this.
