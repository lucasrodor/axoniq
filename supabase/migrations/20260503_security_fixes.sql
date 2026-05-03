-- Migration: Database Security Hardening
-- Resolves Supabase Linter warnings regarding SECURITY DEFINER functions and permissive RLS policies.
-- Path: supabase/migrations/20260503_security_fixes.sql

-- 1. Fix Search Path for SECURITY DEFINER functions (Prevent hijacking)
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'increment_credits') THEN
    ALTER FUNCTION public.increment_credits(uuid) SET search_path = public;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'decrement_credits') THEN
    ALTER FUNCTION public.decrement_credits(uuid) SET search_path = public;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_progress_summary') THEN
    ALTER FUNCTION public.get_user_progress_summary(uuid) SET search_path = public;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
    ALTER FUNCTION public.handle_new_user() SET search_path = public;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user_credits') THEN
    ALTER FUNCTION public.handle_new_user_credits() SET search_path = public;
  END IF;
END $$;

-- 2. Restrict Execution of sensitive functions (Prevent unauthorized RPC calls)
DO $$ 
BEGIN 
  -- increment_credits
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'increment_credits') THEN
    REVOKE EXECUTE ON FUNCTION public.increment_credits(uuid) FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION public.increment_credits(uuid) TO service_role;
  END IF;

  -- decrement_credits
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'decrement_credits') THEN
    REVOKE EXECUTE ON FUNCTION public.decrement_credits(uuid) FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION public.decrement_credits(uuid) TO service_role;
  END IF;

  -- get_user_progress_summary
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_progress_summary') THEN
    REVOKE EXECUTE ON FUNCTION public.get_user_progress_summary(uuid) FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION public.get_user_progress_summary(uuid) TO authenticated;
    GRANT EXECUTE ON FUNCTION public.get_user_progress_summary(uuid) TO service_role;
  END IF;

  -- handle_new_user
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
    REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
  END IF;

  -- handle_new_user_credits
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user_credits') THEN
    REVOKE EXECUTE ON FUNCTION public.handle_new_user_credits() FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION public.handle_new_user_credits() TO service_role;
  END IF;
END $$;

-- 3. Fix RLS policies that were "Always True" for all roles
-- Restricting policies named "Service role..." to ONLY the service_role
DROP POLICY IF EXISTS "Service role full access on subscriptions" ON public.subscriptions;
CREATE POLICY "Service role full access on subscriptions" ON public.subscriptions 
FOR ALL TO service_role 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on user_credits" ON public.user_credits;
CREATE POLICY "Service role full access on user_credits" ON public.user_credits 
FOR ALL TO service_role 
USING (true) 
WITH CHECK (true);
