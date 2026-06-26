-- Activation/retention instrumentation. Applied to prod 2026-06-26.
-- Minimal append-only event log so we can measure the two Phase-0 metrics:
-- real posts/week and week-1 return. Users may only insert their own events;
-- only admins can read. No updates/deletes for anyone (append-only).
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  event text NOT NULL,
  props jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Authenticated users can log only their own events.
DROP POLICY IF EXISTS "analytics_insert_own" ON public.analytics_events;
CREATE POLICY "analytics_insert_own" ON public.analytics_events
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Only admins can read the log.
DROP POLICY IF EXISTS "analytics_admin_read" ON public.analytics_events;
CREATE POLICY "analytics_admin_read" ON public.analytics_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS analytics_events_event_created_idx
  ON public.analytics_events (event, created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_user_created_idx
  ON public.analytics_events (user_id, created_at DESC);

COMMENT ON TABLE public.analytics_events IS
  'Append-only activation/retention event log. Users insert own events; admins read. Phase-0 instrumentation.';
