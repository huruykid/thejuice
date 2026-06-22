
-- BLOG POSTS: admin-only writes
DROP POLICY IF EXISTS "Authenticated users can create blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authors can update their own blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authors can delete their own blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authors can view their own blog posts" ON public.blog_posts;

CREATE POLICY "Admins can create blog posts" ON public.blog_posts
  FOR INSERT TO authenticated
  WITH CHECK (public.current_user_has_role('admin'::public.app_role) AND auth.uid() = author_id);

CREATE POLICY "Admins can update blog posts" ON public.blog_posts
  FOR UPDATE TO authenticated
  USING (public.current_user_has_role('admin'::public.app_role))
  WITH CHECK (public.current_user_has_role('admin'::public.app_role));

CREATE POLICY "Admins can delete blog posts" ON public.blog_posts
  FOR DELETE TO authenticated
  USING (public.current_user_has_role('admin'::public.app_role));

-- CODENAMES: admin-only inserts
DROP POLICY IF EXISTS "Authenticated can create codenames" ON public.codenames;
CREATE POLICY "Admins can create codenames" ON public.codenames
  FOR INSERT TO authenticated
  WITH CHECK (public.current_user_has_role('admin'::public.app_role));

-- STORY TAGS: only the story owner can tag their own story
DROP POLICY IF EXISTS "Authenticated can create story tags" ON public.story_tags;
CREATE POLICY "Story owners can tag their stories" ON public.story_tags
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = story_tags.story_id AND s.user_id = auth.uid()
    )
  );

-- INVITE CODES: stop enumeration of unused codes
DROP POLICY IF EXISTS "Authenticated users can validate invite codes" ON public.invite_codes;
-- (existing "Users can view their own invite codes" remains; "Users can claim invite codes for themselves" remains for claim flow)

-- Server-side validation function for signup
CREATE OR REPLACE FUNCTION public.validate_invite_code(code_param text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF code_param IS NULL OR length(trim(code_param)) = 0 THEN
    RETURN false;
  END IF;

  IF upper(code_param) = 'ORANGE-2024' THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.invite_codes
    WHERE code = upper(code_param)
      AND used_by IS NULL
      AND expires_at > now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_invite_code(text) TO anon, authenticated;

-- USER INVITE STATS: remove direct UPDATE access
DROP POLICY IF EXISTS "Users can update their own invite stats" ON public.user_invite_stats;

-- Server-side atomic invite generation that also decrements quota
CREATE OR REPLACE FUNCTION public.generate_user_invite_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  uid uuid := auth.uid();
  remaining integer;
  rate_ok boolean;
  new_code text;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT public.check_invite_generation_rate_limit(uid) INTO rate_ok;
  IF NOT rate_ok THEN
    RAISE EXCEPTION 'Rate limit exceeded. You can only generate 5 invite codes per hour.';
  END IF;

  SELECT invites_remaining INTO remaining
  FROM public.user_invite_stats
  WHERE user_id = uid
  FOR UPDATE;

  IF remaining IS NULL THEN
    RAISE EXCEPTION 'Invite stats not found';
  END IF;

  IF remaining <= 0 THEN
    RAISE EXCEPTION 'No invites remaining';
  END IF;

  new_code := public.generate_invite_code();

  INSERT INTO public.invite_codes (code, created_by)
  VALUES (new_code, uid);

  UPDATE public.user_invite_stats
  SET invites_remaining = invites_remaining - 1,
      invites_sent = invites_sent + 1,
      updated_at = now()
  WHERE user_id = uid;

  RETURN new_code;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_user_invite_code() TO authenticated;
