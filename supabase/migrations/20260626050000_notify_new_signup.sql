-- Founder alert on every new signup. Applied to prod 2026-06-26.
-- AFTER INSERT on auth.users calls the new-signup-alert edge function via pg_net
-- (async — never blocks or fails the signup). Sits alongside the existing role/profile triggers.
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

DROP TRIGGER IF EXISTS on_auth_user_created_notify ON auth.users;
CREATE TRIGGER on_auth_user_created_notify
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_signup();
