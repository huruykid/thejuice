-- Point the cron jobs + signup trigger at the Vault-stored secrets (rotated 2026-06-26 after
-- a GitGuardian alert on hardcoded gate secrets). The header value is read from
-- vault.decrypted_secrets at call time, so no secret is hardcoded. Secret VALUES live only in
-- Vault (rotated out-of-band; the old leaked values are dead).

-- Selfie sweep cron
select cron.unschedule('daily-selfie-sweep');
select cron.schedule(
  'daily-selfie-sweep',
  '10 4 * * *',
  $$
  select net.http_post(
    url := 'https://mccehajzdnpkpusffhco.supabase.co/functions/v1/selfie-sweep',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-sweep-secret', (select decrypted_secret from vault.decrypted_secrets where name='sweep_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Search-miss nudge cron
select cron.unschedule('daily-search-miss-nudge');
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

-- Signup-alert trigger: read secret from Vault, and NEVER let an alert failure block signup.
CREATE OR REPLACE FUNCTION public.notify_new_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_secret text;
BEGIN
  BEGIN
    SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name = 'signup_secret';
    IF v_secret IS NOT NULL THEN
      PERFORM net.http_post(
        url := 'https://mccehajzdnpkpusffhco.supabase.co/functions/v1/new-signup-alert',
        headers := jsonb_build_object('Content-Type', 'application/json', 'x-signup-secret', v_secret),
        body := jsonb_build_object('user_id', NEW.id, 'email', NEW.email, 'created_at', NEW.created_at)
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- alerting must never block a signup
  END;
  RETURN NEW;
END;
$$;
