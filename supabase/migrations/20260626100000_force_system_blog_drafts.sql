-- AI/system-generated blog posts (author_id IS NULL) must start as drafts so an admin
-- reviews them before they go public. Applied to prod 2026-06-26. Admin-authored posts
-- (author_id = the admin) are unaffected. Enforced at the DB so it holds regardless of the
-- generator function's code.
CREATE OR REPLACE FUNCTION public.force_system_blog_drafts()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.author_id IS NULL THEN
    NEW.published := false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS blog_posts_force_system_drafts ON public.blog_posts;
CREATE TRIGGER blog_posts_force_system_drafts
  BEFORE INSERT ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.force_system_blog_drafts();
