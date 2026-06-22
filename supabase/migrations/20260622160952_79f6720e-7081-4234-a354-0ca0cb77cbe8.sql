
-- comments: restrict SELECT to authenticated
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
CREATE POLICY "Authenticated users can view comments"
  ON public.comments FOR SELECT
  TO authenticated
  USING (true);

-- reactions: restrict SELECT to authenticated
DROP POLICY IF EXISTS "Reactions are viewable by everyone" ON public.reactions;
CREATE POLICY "Authenticated users can view reactions"
  ON public.reactions FOR SELECT
  TO authenticated
  USING (true);

-- security_audit_logs: restrict INSERT to authenticated and to own user_id (or null for system).
-- SECURITY DEFINER functions run as owner and bypass RLS, so they remain unaffected.
DROP POLICY IF EXISTS "System can insert audit logs" ON public.security_audit_logs;
CREATE POLICY "Users can insert their own audit logs"
  ON public.security_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

-- user_invite_stats: restrict INSERT to authenticated and own user_id.
-- The handle_new_user_invite_stats SECURITY DEFINER trigger bypasses RLS.
DROP POLICY IF EXISTS "System can insert invite stats for new users" ON public.user_invite_stats;
CREATE POLICY "Users can insert their own invite stats"
  ON public.user_invite_stats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- invite_codes: restrict SELECT to authenticated, and tighten UPDATE so only the claiming user can mark a code used.
DROP POLICY IF EXISTS "Limited invite code validation access" ON public.invite_codes;
CREATE POLICY "Authenticated users can validate invite codes"
  ON public.invite_codes FOR SELECT
  TO authenticated
  USING (
    ((used_by IS NULL) AND (expires_at > now()))
    OR ((auth.uid() = created_by) AND (created_by IS NOT NULL))
  );

DROP POLICY IF EXISTS "Invite codes can be marked as used during signup" ON public.invite_codes;
CREATE POLICY "Users can claim invite codes for themselves"
  ON public.invite_codes FOR UPDATE
  TO authenticated
  USING ((used_by IS NULL) AND (expires_at > now()))
  WITH CHECK (
    (used_by IS NOT NULL)
    AND (used_at IS NOT NULL)
    AND (auth.uid() = used_by)
  );
