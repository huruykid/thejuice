
-- file_access_logs: restrict INSERT to authenticated users and enforce auth.uid() = user_id
DROP POLICY IF EXISTS "System can insert file access logs" ON public.file_access_logs;
DROP POLICY IF EXISTS "Users can insert their own file access logs" ON public.file_access_logs;
DROP POLICY IF EXISTS "Authenticated users can insert their own file access logs" ON public.file_access_logs;
CREATE POLICY "Authenticated users can insert their own file access logs"
  ON public.file_access_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- invite_codes: restrict create policy to authenticated role
DROP POLICY IF EXISTS "Users can create invite codes" ON public.invite_codes;
CREATE POLICY "Users can create invite codes"
  ON public.invite_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- reports: restrict file reports to authenticated, enforce reporter_id = auth.uid()
DROP POLICY IF EXISTS "Users can file reports" ON public.reports;
CREATE POLICY "Users can file reports"
  ON public.reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- story_tags: restrict SELECT to authenticated users (mirrors stories visibility)
DROP POLICY IF EXISTS "Story tags are viewable by everyone" ON public.story_tags;
CREATE POLICY "Story tags are viewable by authenticated users"
  ON public.story_tags
  FOR SELECT
  TO authenticated
  USING (true);
REVOKE SELECT ON public.story_tags FROM anon;

-- user_blocks: restrict INSERT/DELETE to authenticated and enforce blocker_id = auth.uid()
DROP POLICY IF EXISTS "Users can create their own blocks" ON public.user_blocks;
DROP POLICY IF EXISTS "Users can insert their own blocks" ON public.user_blocks;
DROP POLICY IF EXISTS "Users can block other users" ON public.user_blocks;
CREATE POLICY "Authenticated users can create their own blocks"
  ON public.user_blocks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can delete their own blocks" ON public.user_blocks;
DROP POLICY IF EXISTS "Users can unblock users" ON public.user_blocks;
CREATE POLICY "Authenticated users can delete their own blocks"
  ON public.user_blocks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = blocker_id);
