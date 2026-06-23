
-- Fix 1: invite_codes — remove broad UPDATE policy. Claims must go through SECURITY DEFINER use_invite_code() RPC.
DROP POLICY IF EXISTS "Users can claim invite codes for themselves" ON public.invite_codes;

-- Fix 2: story_tags — restrict SELECT to tags on visible stories (approved, or owned by viewer, or admin).
DROP POLICY IF EXISTS "Story tags are viewable by authenticated users" ON public.story_tags;

CREATE POLICY "Story tags follow story visibility"
ON public.story_tags
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.stories s
    WHERE s.id = story_tags.story_id
      AND (
        s.status = 'approved'
        OR s.user_id = auth.uid()
        OR public.current_user_has_role('admin'::public.app_role)
      )
  )
);
