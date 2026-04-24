-- Migration: Monetization Infrastructure (Stripe + Credits)
-- Tables: subscriptions, user_credits
-- Modifications: profiles (add is_admin, is_whitelisted)

-- 1. Add monetization fields to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_whitelisted boolean DEFAULT false;

-- 2. Subscriptions table (synced via Stripe Webhook)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text DEFAULT 'inactive' CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'inactive')),
  plan_interval text CHECK (plan_interval IN ('monthly', 'semiannual', 'annual')),
  price_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS for subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Service role can do everything (for webhook)
CREATE POLICY "Service role full access on subscriptions" ON public.subscriptions FOR ALL USING (true) WITH CHECK (true);

-- 3. User Credits table (tracks monthly AI generation usage)
CREATE TABLE IF NOT EXISTS public.user_credits (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  credits_used int DEFAULT 0,
  credits_limit int DEFAULT 10,
  period_start timestamptz DEFAULT date_trunc('month', now()),
  updated_at timestamptz DEFAULT now()
);

-- RLS for user_credits
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own credits" ON public.user_credits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access on user_credits" ON public.user_credits FOR ALL USING (true) WITH CHECK (true);

-- 4. Auto-create credits row when profile is created
CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, credits_used, credits_limit, period_start)
  VALUES (NEW.id, 0, 10, date_trunc('month', now()))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger: create credits row when a new profile is inserted
DROP TRIGGER IF EXISTS on_profile_created_credits ON public.profiles;
CREATE TRIGGER on_profile_created_credits
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_credits();

-- 5. Set the admin flag for the owner
UPDATE public.profiles SET is_admin = true WHERE id = (
  SELECT id FROM auth.users WHERE email = 'lucasrodor@gmail.com' LIMIT 1
);

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
