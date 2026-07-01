-- Performance + hardening pass (from Supabase advisors, 2026-07-01)
--
-- 1) auth_rls_initplan: wrap bare auth.uid()/auth.jwt() calls in RLS policies
--    in a scalar subselect so Postgres evaluates them once per statement
--    instead of once per row. Semantics are identical.
-- 2) unindexed_foreign_keys: add missing FK indexes on public tables.
-- 3) Defense-in-depth: revoke EXECUTE from anon on admin-only seed-story RPCs.
--    (They already raise 'forbidden' via has_role(), and authenticated keeps
--    EXECUTE because the admin panel calls them as a signed-in admin.)

-- 1) Rewrite flagged policies in place
do $$
declare
  r record;
  new_qual text;
  new_check text;
  stmt text;
begin
  for r in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (
        (qual is not null and qual ~ 'auth\.(uid|jwt)\(\)' and qual !~ '\(\s*(select|SELECT)\s+auth\.')
        or
        (with_check is not null and with_check ~ 'auth\.(uid|jwt)\(\)' and with_check !~ '\(\s*(select|SELECT)\s+auth\.')
      )
  loop
    new_qual := case when r.qual is null then null
      else regexp_replace(r.qual, 'auth\.(uid|jwt)\(\)', '(select auth.\1())', 'g') end;
    new_check := case when r.with_check is null then null
      else regexp_replace(r.with_check, 'auth\.(uid|jwt)\(\)', '(select auth.\1())', 'g') end;

    stmt := format('alter policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
    if new_qual is not null then
      stmt := stmt || format(' using (%s)', new_qual);
    end if;
    if new_check is not null then
      stmt := stmt || format(' with check (%s)', new_check);
    end if;
    execute stmt;
  end loop;
end $$;

-- 2) Missing FK indexes (public schema only)
create index if not exists idx_stories_profile_id on public.stories (profile_id);
create index if not exists idx_comments_profile_id on public.comments (profile_id);
create index if not exists idx_comments_user_id on public.comments (user_id);
create index if not exists idx_blog_posts_author_id on public.blog_posts (author_id);
create index if not exists idx_dispute_requests_story_id on public.dispute_requests (story_id);
create index if not exists idx_dispute_requests_reviewed_by on public.dispute_requests (reviewed_by);

-- 3) Admin seed RPCs: not callable while signed out
revoke execute on function public.admin_create_seed_story(text, text, text, integer, integer, integer, integer, text) from anon;
revoke execute on function public.admin_delete_seed_story(uuid) from anon;
revoke execute on function public.admin_list_members() from anon;
