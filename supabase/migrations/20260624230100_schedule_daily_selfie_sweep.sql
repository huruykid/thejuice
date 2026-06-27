-- Applied to prod 2026-06-24 via connector.
-- Daily backstop: re-run the selfie sweep so any verification photo that slips through
-- (failed approval-delete, rejected user, etc.) is removed within 24h.
-- Secret is read from Supabase Vault at call time (see migration
-- 20260626070000_internal_secret_accessor + 20260626080000_rotate_callers_to_vault_secrets).

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
      'x-sweep-secret', (select decrypted_secret from vault.decrypted_secrets where name='sweep_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
