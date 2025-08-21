-- Fix security linter warnings

-- 1. Fix function search path mutability by setting search_path for all new functions
CREATE OR REPLACE FUNCTION public.is_blocked(_actor uuid, _target uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE blocker_id = _actor AND blocked_id = _target
  );
$$;

CREATE OR REPLACE FUNCTION public.get_story_owner(_story_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT user_id FROM public.stories WHERE id = _story_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_user_suspended(_user uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_suspensions s
    WHERE s.user_id = _user
      AND (s.revoked_at IS NULL)
      AND (s.expires_at IS NULL OR s.expires_at > now())
  );
$$;

-- 2. Already addressed pg_net extension in public - it's managed by Supabase
-- The warning is expected and acceptable as confirmed by the is_pg_net_exception_acceptable function