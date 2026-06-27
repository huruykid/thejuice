-- Daily "still no tea on {name}" nudge. Applied to prod 2026-06-26.
-- Runs at 17:00 UTC (~1pm ET / 10am PT). Mirrors the daily-selfie-sweep pattern:
-- pg_cron + pg_net calling the secret-gated search-miss-nudge edge function.
select cron.schedule(
  'daily-search-miss-nudge',
  '0 17 * * *',
  $$
  select net.http_post(
    url := 'https://mccehajzdnpkpusffhco.supabase.co/functions/v1/search-miss-nudge',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-nudge-secret', (select decrypted_secret from vault.decrypted_secrets where name='nudge_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
