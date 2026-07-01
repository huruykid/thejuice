-- Tighten the verified-only gate to match the stories read policy.
-- Before: comments & reactions were readable by ANY authenticated user (even
-- unverified/pending), and story creation didn't require verification.
-- After: reads require verification (seed/example posts stay visible so the
-- unverified teaser isn't empty), and creating a story requires verification.

-- Helper: is a given story a seed/example post? SECURITY DEFINER so the check
-- does not depend on the caller's own visibility into stories.
create or replace function public.is_seed_story(_story_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.stories where id = _story_id and is_seed = true
  );
$$;

-- COMMENTS: reads now require verification (parity with the stories gate),
-- but seed/example posts stay visible so the unverified teaser isn't empty.
drop policy if exists "Authenticated users can view comments" on public.comments;
create policy "Verified users can view comments"
  on public.comments for select to authenticated
  using (
    public.is_user_verified(auth.uid())
    or public.is_seed_story(story_id)
  );

-- REACTIONS: same treatment.
drop policy if exists "Authenticated users can view reactions" on public.reactions;
create policy "Verified users can view reactions"
  on public.reactions for select to authenticated
  using (
    public.is_user_verified(auth.uid())
    or public.is_seed_story(story_id)
  );

-- STORIES: require verification to CREATE a post (parity with comments/reactions).
-- Anonymous public submissions keep their own separate policy.
drop policy if exists "Authenticated users can create stories" on public.stories;
create policy "Verified users can create stories"
  on public.stories for insert to authenticated
  with check (
    auth.uid() = user_id
    and public.is_user_verified(auth.uid())
    and (not public.is_user_suspended(auth.uid()))
    and submitted_anonymously = false
    and is_seed = false
  );
