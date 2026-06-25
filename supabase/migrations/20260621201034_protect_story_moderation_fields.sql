-- CATCH-UP FILE: applied to prod but missing from repo. Recreated 2026-06-24 to
-- reconcile history. Already applied in prod — mark applied, do not re-run.
--
-- Prevent authors from changing their own post's moderation status (self-approval).
-- Only admins can move a story between pending/approved/rejected.

CREATE OR REPLACE FUNCTION public.protect_story_moderation_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public.current_user_has_role('admin'::public.app_role) THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      IF NEW.status = 'approved' THEN
        NEW.approved_at := now();
        NEW.approved_by := auth.uid();
      ELSE
        NEW.approved_at := NULL;
        NEW.approved_by := NULL;
      END IF;
    END IF;
  ELSE
    NEW.status := OLD.status;
    NEW.approved_at := OLD.approved_at;
    NEW.approved_by := OLD.approved_by;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_story_moderation ON public.stories;
CREATE TRIGGER trg_protect_story_moderation
  BEFORE UPDATE ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.protect_story_moderation_fields();

REVOKE EXECUTE ON FUNCTION public.protect_story_moderation_fields() FROM PUBLIC, anon, authenticated;
