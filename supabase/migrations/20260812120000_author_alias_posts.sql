-- Operator posts publish under a fresh random codename instead of the admin's handle.
--
-- Why: the feed is seeded and grown by one operator account. Every post that account
-- makes through the normal composer renders "Reviewed by @<admin codename>", which both
-- exposes who runs the app and makes the feed read like one person talking to himself.
--
-- The shape:
--   * stories.author_alias — a per-story display handle. When set, it is what the UI
--     renders; the story's profile_id/user_id are NULL so there is nothing in the row
--     (or in any client-visible column) that ties the batch back to one account.
--   * generate_author_alias() — two-word snake handles in the house style (@quietly_done),
--     never colliding with a real member's codename and avoiding already-used aliases.
--   * create_aliased_story() — admin-gated insert that does the whole post in one call:
--     alias, story row, tags, and the peppered subject-phone hash. The client can't do
--     these itself once user_id is NULL (story_tags INSERT and
--     set_story_subject_phone_hash both key on user_id = auth.uid()).
--
-- is_seed = true is deliberate. These are operator-authored posts, not organic community
-- posts: keeping the flag honest is what keeps activation metrics (useFeedGate,
-- useHasApprovedPost, AdminOverview) measuring real members, and it routes these rows to
-- the seed admin screen where they can be managed and deleted.

-- ---------------------------------------------------------------------------
-- 1. The column
-- ---------------------------------------------------------------------------
alter table public.stories
  add column if not exists author_alias text;

alter table public.stories
  drop constraint if exists stories_author_alias_format;

-- Same character class the app enforces for member codenames, so an alias is
-- indistinguishable from a real handle in the UI.
alter table public.stories
  add constraint stories_author_alias_format
  check (author_alias is null or author_alias ~ '^[a-z0-9_]{3,24}$');

comment on column public.stories.author_alias is
  'Per-story display handle for operator-authored posts. When set, the UI renders this instead of profiles.anonymous_username, and the row carries no profile_id/user_id.';

-- Cheap dedupe lookup for the generator.
create index if not exists stories_author_alias_idx
  on public.stories (author_alias)
  where author_alias is not null;

-- ---------------------------------------------------------------------------
-- 2. Alias generator
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER because it reads profiles (RLS-protected) to avoid handing an
-- alias that impersonates a real member. Not granted to anyone: it is only ever
-- called from inside create_aliased_story, which runs as the function owner.
create or replace function public.generate_author_alias()
returns text
language plpgsql
volatile
security definer
set search_path to 'public'
as $function$
declare
  -- House style: lowercase, two words, snake_case — @quietly_done, @late_reply.
  k_first constant text[] := array[
    'quietly', 'mostly', 'barely', 'nearly', 'oddly', 'calmly', 'plainly', 'lately',
    'softly', 'rarely', 'gently', 'bluntly', 'coldly', 'evenly', 'flatly', 'fairly',
    'twice', 'once', 'still', 'almost', 'half', 'double', 'zero', 'slow',
    'quiet', 'plain', 'honest', 'blunt', 'steady', 'patient', 'tired', 'polite',
    'north', 'south', 'east', 'west', 'uptown', 'downtown', 'midnight', 'sunday'
  ];
  k_second constant text[] := array[
    'done', 'over', 'out', 'home', 'gone', 'clear', 'even', 'square',
    'reply', 'answer', 'signal', 'excuse', 'receipt', 'red_flag', 'green_flag', 'story',
    'coffee', 'brunch', 'dinner', 'drive', 'flight', 'text', 'call', 'ghost',
    'monday', 'friday', 'weekend', 'season', 'summer', 'winter', 'chapter', 'ending',
    'lesson', 'pattern', 'habit', 'boundary', 'standard', 'exit', 'closure', 'peace'
  ];
  candidate text;
  attempt integer;
begin
  for attempt in 1..12 loop
    candidate :=
      k_first[1 + floor(random() * array_length(k_first, 1))::integer]
      || '_' ||
      k_second[1 + floor(random() * array_length(k_second, 1))::integer];

    -- Widen the space once the plain combinations start colliding.
    if attempt > 6 then
      candidate := candidate || (10 + floor(random() * 90))::integer::text;
    end if;

    -- Never hand out a handle a real member already answers to — an alias that
    -- matches a member's codename puts words in that member's mouth.
    if exists (
      select 1 from public.profiles p
      where lower(p.anonymous_username) = candidate
    ) then
      continue;
    end if;

    if exists (
      select 1 from public.stories s where s.author_alias = candidate
    ) then
      continue;
    end if;

    return candidate;
  end loop;

  -- Exhausted the readable options; fall back to something certainly free.
  return 'member_' || substr(md5(random()::text || clock_timestamp()::text), 1, 8);
end;
$function$;

revoke execute on function public.generate_author_alias() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Admin-gated aliased post
-- ---------------------------------------------------------------------------
create or replace function public.create_aliased_story(
  p_content text,
  p_image_url text,
  p_subject_name text default null,
  p_subject_phone text default null,
  p_location text default null,
  p_city_id uuid default null,
  p_verdict integer default 0,
  p_tags text[] default array[]::text[]
)
returns table (story_id uuid, alias text)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_alias text;
  v_id uuid;
  v_content text;
  v_tag text;
  v_clean_tags text[] := array[]::text[];
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'forbidden';
  end if;

  v_content := btrim(coalesce(p_content, ''));
  if v_content = '' then
    raise exception 'content required';
  end if;
  if length(v_content) > 5000 then
    raise exception 'content too long (max 5000)';
  end if;
  -- The feed filters `image_url is not null` (src/hooks/useStories.ts); a story
  -- without one inserts fine and is invisible. Fail loudly instead.
  if nullif(btrim(coalesce(p_image_url, '')), '') is null then
    raise exception 'image required';
  end if;

  v_alias := public.generate_author_alias();

  insert into public.stories (
    content, subject_name, location, city_id, image_url,
    user_id, profile_id, author_alias,
    is_seed, status, submitted_anonymously, approved_at,
    communication_rating, loyalty_rating, overall_vibe_rating, emotional_safety_rating
  ) values (
    v_content,
    nullif(btrim(coalesce(p_subject_name, '')), ''),
    nullif(btrim(coalesce(p_location, '')), ''),
    p_city_id,
    btrim(p_image_url),
    -- NULL owner is the whole point: user_id is a client-visible column, so leaving
    -- the admin's uid here would let anyone group every aliased post back together.
    null, null, v_alias,
    true, 'approved', false, now(),
    0, 0,
    -- Verdict column: -1 milk / 0 none / +1 juice. Not 1..5 stars.
    greatest(-1, least(1, coalesce(p_verdict, 0))),
    0
  )
  returning id into v_id;

  -- Tags. story_tags INSERT policy keys on stories.user_id = auth.uid(), which is
  -- NULL here, so the client cannot write these itself.
  if p_tags is not null then
    foreach v_tag in array p_tags loop
      v_tag := btrim(coalesce(v_tag, ''));
      if v_tag <> '' and length(v_tag) <= 50 and not (v_tag = any (v_clean_tags)) then
        v_clean_tags := v_clean_tags || v_tag;
      end if;
      exit when array_length(v_clean_tags, 1) >= 10;
    end loop;

    if array_length(v_clean_tags, 1) > 0 then
      insert into public.story_tags (story_id, tag)
      select v_id, t from unnest(v_clean_tags) as t;
    end if;
  end if;

  -- Phone is stored only as a peppered hash, never in plaintext. Same reason as
  -- tags: set_story_subject_phone_hash matches on user_id = auth.uid().
  if nullif(btrim(coalesce(p_subject_phone, '')), '') is not null then
    update public.stories
       set subject_phone_hash = public.hash_subject_phone(p_subject_phone)
     where id = v_id;
  end if;

  return query select v_id, v_alias;
end;
$function$;

-- Grants: functions default to EXECUTE for PUBLIC, so revoking from anon alone is a
-- no-op. Revoke from PUBLIC, then re-grant the roles that need it. has_role() inside
-- the function is the real gate.
revoke execute on function public.create_aliased_story(text, text, text, text, text, uuid, integer, text[]) from public, anon;
grant execute on function public.create_aliased_story(text, text, text, text, text, uuid, integer, text[]) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. Storage: admins may write under seed/
-- ---------------------------------------------------------------------------
-- Story images are stored as object paths and the path ships to every client in
-- `image_url`. The existing upload policy forces the first folder segment to be the
-- uploader's uid, which would print the admin's uid on every aliased post — the same
-- leak the NULL user_id above closes. `seed/` is already the read-side convention for
-- operator content ("Story images: seeds for any signed-in user, all for verified"),
-- so let admins write there and put aliased-post photos under seed/<random>/.
drop policy if exists "Admins can upload seed story images" on storage.objects;
create policy "Admins can upload seed story images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'story-images'
    and starts_with(name, 'seed/')
    -- current_user_has_role is the form the other policies on this table use, and
    -- the scalar subquery keeps it out of the per-row initplan.
    and (select public.current_user_has_role('admin'::app_role))
  );

drop policy if exists "Admins can manage seed story images" on storage.objects;
create policy "Admins can manage seed story images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'story-images'
    and starts_with(name, 'seed/')
    and (select public.current_user_has_role('admin'::app_role))
  );
