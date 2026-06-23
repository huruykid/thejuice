
-- (a) Require an image on all non-seed stories. NOT VALID so the 3 existing
-- approved rows (which predate this rule) aren't retroactively rejected.
ALTER TABLE public.stories
  ADD CONSTRAINT stories_require_image
  CHECK (is_seed = true OR image_url IS NOT NULL)
  NOT VALID;

-- (b) Remove auto-approval for verified users — every new story now lands in
-- the moderation queue and must be approved by an admin.
CREATE OR REPLACE FUNCTION public.set_story_initial_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.is_seed = true THEN
    -- Seed content keeps whatever status it was inserted with
    RETURN NEW;
  END IF;

  NEW.status := 'pending';
  NEW.approved_at := NULL;
  NEW.approved_by := NULL;
  RETURN NEW;
END;
$function$;
