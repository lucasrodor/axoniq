-- Migration: Add Lifetime Plan support
-- Modifications: subscriptions (update check constraint for plan_interval)

-- 1. Update the check constraint to include 'lifetime'
ALTER TABLE public.subscriptions 
DROP CONSTRAINT IF EXISTS subscriptions_plan_interval_check;

ALTER TABLE public.subscriptions 
ADD CONSTRAINT subscriptions_plan_interval_check 
CHECK (plan_interval IN ('monthly', 'semiannual', 'annual', 'lifetime'));

-- 2. Ensure credits_limit can be high for lifetime users
-- (This is usually handled by the app logic but good to have a high default if we ever set it manually)
