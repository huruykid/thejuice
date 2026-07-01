-- Consolidate multiple permissive RLS policies (advisor: multiple_permissive_policies)
--
-- Postgres ORs permissive policies together and evaluates EVERY one per row.
-- Merging same-table/same-command policies into a single OR'd policy is
-- semantics-preserving and halves (or better) per-row policy evaluation.
-- Admin checks are wrapped in scalar subselects so they run once per statement.
--
-- Bonus fix: the old "Admins can update any story" policy had WITH CHECK (true)
-- (advisor: rls_policy_always_true). The merged policy scopes the check properly.

-- ── blog_posts: SELECT (2 → 1) ────────────────────────────────────────────────
drop policy if exists "Admins can view all blog posts" on public.blog_posts;
drop policy if exists "Blog posts are viewable by everyone" on public.blog_posts;
create policy "Blog posts readable when published or admin" on public.blog_posts
  for select using (
    (published = true)
    or (select current_user_has_role('admin'::app_role))
  );

-- ── profiles: SELECT (2 → 1) ──────────────────────────────────────────────────
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Profiles readable by owner or admin" on public.profiles
  for select using (
    ((select auth.uid()) = user_id)
    or (select current_user_has_role('admin'::app_role))
  );

-- ── reports: SELECT (2 → 1) ───────────────────────────────────────────────────
drop policy if exists "Admins can view and update reports" on public.reports;
drop policy if exists "Reporters can view their own reports" on public.reports;
create policy "Reports readable by reporter or admin" on public.reports
  for select using (
    ((select auth.uid()) = reporter_id)
    or (select current_user_has_role('admin'::app_role))
  );

-- ── stories: SELECT (4 → 1), UPDATE (2 → 1), DELETE (2 → 1) ──────────────────
drop policy if exists "Admins see all stories" on public.stories;
drop policy if exists "Approved community posts viewable by verified users" on public.stories;
drop policy if exists "Seed posts viewable by authenticated users" on public.stories;
drop policy if exists "Users see their own stories" on public.stories;
create policy "Stories readable: own, seed, approved-for-verified, or admin" on public.stories
  for select to authenticated using (
    ((select auth.uid()) = user_id)
    or (is_seed = true and status = 'approved'::text)
    or (
      status = 'approved'::text
      and is_seed = false
      and (select is_user_verified((select auth.uid())))
    )
    or (select current_user_has_role('admin'::app_role))
  );

drop policy if exists "Admins can update any story" on public.stories;
drop policy if exists "Users can update their own stories" on public.stories;
create policy "Stories updatable by owner (while pending) or admin" on public.stories
  for update to authenticated
  using (
    ((select auth.uid()) = user_id)
    or (select current_user_has_role('admin'::app_role))
  )
  with check (
    (select current_user_has_role('admin'::app_role))
    or (
      ((select auth.uid()) = user_id)
      and status = 'pending'::text
      and is_seed = false
    )
  );

drop policy if exists "Admins can delete any story" on public.stories;
drop policy if exists "Users can delete their own stories" on public.stories;
create policy "Stories deletable by owner or admin" on public.stories
  for delete using (
    ((select auth.uid()) = user_id)
    or (select current_user_has_role('admin'::app_role))
  );

-- ── user_blocks: SELECT (2 → 1) ───────────────────────────────────────────────
drop policy if exists "Admins can view all blocks" on public.user_blocks;
drop policy if exists "Users can view their own blocks" on public.user_blocks;
create policy "Blocks readable by blocker or admin" on public.user_blocks
  for select using (
    ((select auth.uid()) = blocker_id)
    or (select current_user_has_role('admin'::app_role))
  );

-- ── user_roles: SELECT (2 → 1) ────────────────────────────────────────────────
drop policy if exists "Admins can view all roles" on public.user_roles;
drop policy if exists "Users can view their own roles" on public.user_roles;
create policy "Roles readable by owner or admin" on public.user_roles
  for select using (
    ((select auth.uid()) = user_id)
    or (select current_user_has_role('admin'::app_role))
  );

-- ── user_suspensions: admin FOR ALL overlapped user SELECT → split per command ─
drop policy if exists "Admins manage suspensions" on public.user_suspensions;
drop policy if exists "Users can view their own suspension" on public.user_suspensions;
create policy "Suspensions readable by subject or admin" on public.user_suspensions
  for select using (
    ((select auth.uid()) = user_id)
    or (select current_user_has_role('admin'::app_role))
  );
create policy "Admins can insert suspensions" on public.user_suspensions
  for insert with check ((select current_user_has_role('admin'::app_role)));
create policy "Admins can update suspensions" on public.user_suspensions
  for update using ((select current_user_has_role('admin'::app_role)))
  with check ((select current_user_has_role('admin'::app_role)));
create policy "Admins can delete suspensions" on public.user_suspensions
  for delete using ((select current_user_has_role('admin'::app_role)));

-- ── user_verifications: admin FOR ALL overlapped user SELECT/INSERT/UPDATE ─────
drop policy if exists "Admins can view all verifications" on public.user_verifications;
drop policy if exists "Users can create their own verification" on public.user_verifications;
drop policy if exists "Users can view their own verification" on public.user_verifications;
drop policy if exists "Users can update their own verification" on public.user_verifications;
create policy "Verifications readable by owner or admin" on public.user_verifications
  for select using (
    ((select auth.uid()) = user_id)
    or (select current_user_has_role('admin'::app_role))
  );
create policy "Verifications insertable by owner or admin" on public.user_verifications
  for insert with check (
    ((select auth.uid()) = user_id)
    or (select current_user_has_role('admin'::app_role))
  );
create policy "Verifications updatable by owner (unapproved) or admin" on public.user_verifications
  for update
  using (
    ((select auth.uid()) = user_id)
    or (select current_user_has_role('admin'::app_role))
  )
  with check (
    (select current_user_has_role('admin'::app_role))
    or (
      ((select auth.uid()) = user_id)
      and verification_status <> 'approved'::text
    )
  );
create policy "Admins can delete verifications" on public.user_verifications
  for delete using ((select current_user_has_role('admin'::app_role)));
