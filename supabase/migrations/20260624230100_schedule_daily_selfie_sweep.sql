-- Applied to prod 2026-06-24 via connector.
-- Daily backstop: re-run the selfie sweep so any verification photo that slips through
-- (failed approval-delete, rejected user, etc.) is removed within 24h.
-- NOTE: contains the sweep secret to match the deployed cron job — relocate/rotate if
-- this repo is public (see supabase/functions/selfie-sweep/index.ts).

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.unschedule('daily-selfie-sweep')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-selfie-sweep');

SELECT cron.schedule(
  'daily-selfie-sweep',
  '10 4 * * *',
  $$
  SELECT net.http_post(
    url := 'https://mccehajzdnpkpusffhco.supabase.co/functions/v1/selfie-sweep',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-sweep-secret', 'swp_3xR9Kqz7Lm2Tn8Vb4Wd6Yc1Pf5Hg0Js'
    ),
    body := '{}'::jsonb
  );
  $$
);
