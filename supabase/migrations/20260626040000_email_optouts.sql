-- CAN-SPAM opt-out registry for non-transactional (marketing/reactivation) email.
-- Applied to prod 2026-06-26.
-- Written/read only by service-role edge functions (RLS on, no policies = no client access).
CREATE TABLE IF NOT EXISTS public.email_optouts (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.email_optouts ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.email_optouts IS
  'Users who unsubscribed from marketing/reactivation email. Excluded from broadcasts. Service-role only.';
