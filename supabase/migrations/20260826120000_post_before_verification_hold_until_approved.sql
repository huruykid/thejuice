-- Let members write the review before they're verified; hold it until they are.
--
-- Why: in the first month, 91 of 104 signups searched a name, every search was a
-- miss, and 0 reviews were posted. Motivation peaks at the miss; approval arrives a
-- median 32 hours later to a user who has forgotten us. The UI has promised
-- "post now, no verification needed" since June, but the INSERT policy from
-- 2026-06-29 requires is_user_verified(), so every unverified attempt failed.
--
-- Model after this migration:
--   * Any signed-in, non-suspended member can INSERT their own story. It lands
--     'pending' (set_story_initial_status forces that regardless of input).
--   * A pending story by an author who is not yet verified cannot be APPROVED —
--     the moderation trigger refuses, so "reviews by verified men" stays true at
--     the database layer, not just in admin habits. Approve the selfie first.
--   * Reads are untouched: is_user_verified() still gates every community read,
--     and an unverified author can only ever see their own rows.
--
-- Applied to prod 2026-08-26 via Supabase MCP.

-- ── INSERT: verification no longer required to create a (pending) story ──────
drop policy if exists "Verified users can create stories" on public.stories;
drop policy if exists "Members can create stories" on public.stories;
create policy "Members can create stories"
  on public.stories for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and not public.is_user_suspended((select auth.uid()))
    and submitted_anonymously = false
    and is_seed = false
  );

-- ── UPDATE guard: no publishing a story whose author isn't verified ──────────
-- Extends protect_story_moderation_fields (2026-06-22). Non-admin branch is
-- unchanged. Aliased operator posts and anonymous submissions have user_id NULL
-- and are exempt — they were never member reviews.
create or replace function public.protect_story_moderation_fields()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if public.current_user_has_role('admin'::public.app_role) then
    if new.status is distinct from old.status then
      if new.status = 'approved' then
        if new.is_seed = false
           and new.user_id is not null
           and not public.is_user_verified(new.user_id) then
          raise exception 'This member is not verified yet — approve their selfie first, then the post.'
            using errcode = 'check_violation';
        end if;
        new.approved_at := now();
        new.approved_by := auth.uid();
      else
        new.approved_at := null;
        new.approved_by := null;
      end if;
    end if;
  else
    -- non-admins cannot alter moderation/seed fields
    new.status := old.status;
    new.approved_at := old.approved_at;
    new.approved_by := old.approved_by;
    new.is_seed := old.is_seed;
  end if;
  return new;
end;
$$;

-- ── Admin helper: pending reviews held behind a member's verification ────────
-- Used by the approval flow to tell the member (and the admin) what's waiting.
-- Admin-only; returns subject names + ids, nothing else.
create or replace function public.admin_held_reviews_for_user(_user_id uuid)
returns table (story_id uuid, subject_name text, created_at timestamptz)
language sql
stable
security definer
set search_path to 'public'
as $$
  select s.id, s.subject_name, s.created_at
  from public.stories s
  where s.user_id = _user_id
    and s.status = 'pending'
    and s.is_seed = false
    and public.current_user_has_role('admin'::public.app_role)
  order by s.created_at asc;
$$;

revoke execute on function public.admin_held_reviews_for_user(uuid) from public;
revoke execute on function public.admin_held_reviews_for_user(uuid) from anon;
grant execute on function public.admin_held_reviews_for_user(uuid) to authenticated;
grant execute on function public.admin_held_reviews_for_user(uuid) to service_role;
