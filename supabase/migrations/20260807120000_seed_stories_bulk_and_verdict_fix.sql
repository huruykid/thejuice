-- Seeding the feed at volume, plus a verdict bug that made the existing tool lie.
--
-- 1. BUG FIX. `overall_vibe_rating` is a VERDICT column (+1 juice / -1 milk / 0 none) —
--    StoryCard.tsx and AdminPosts.tsx both branch on `> 0 ? juice : milk`, and the normal
--    post path (useStories.ts) writes the raw +1/-1/0. But admin_create_seed_story clamped
--    every rating column with `greatest(1, least(5, x))`, which maps -1 -> 1. So a seed
--    story published with "Red flag" selected rendered in the feed as JUICE. The 1..5 clamp
--    is a leftover from when these were star ratings; the verdict columns now clamp to -1..1.
--
-- 2. NEW: admin_create_seed_stories_bulk. The single-story RPC means seeding a feed is a
--    one-at-a-time slog. This takes a JSON array, resolves city_id from the location string
--    (so the "my city" feed filter works on seeds), and staggers created_at backwards so a
--    batch doesn't land as 30 rows sharing one timestamp at the top of the feed.
--
-- Note for whoever seeds next: Home/Explore filter `.not('image_url','is',null)`
-- (src/hooks/useStories.ts) because photos are required on real posts. A seed story with a
-- null image is inserted successfully and is invisible in the feed. Always pass image_url.

-- ---------------------------------------------------------------------------
-- 1. Verdict clamp fix on the existing single-story RPC
-- ---------------------------------------------------------------------------
create or replace function public.admin_create_seed_story(
  p_content text,
  p_subject_name text default null,
  p_location text default null,
  p_communication integer default 0,
  p_loyalty integer default 0,
  p_vibe integer default 0,
  p_emotional_safety integer default 0,
  p_image_url text default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare new_id uuid;
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'forbidden';
  end if;
  if p_content is null or btrim(p_content) = '' then
    raise exception 'content required';
  end if;
  insert into public.stories (
    content, subject_name, location, is_seed, status, submitted_anonymously,
    communication_rating, loyalty_rating, overall_vibe_rating, emotional_safety_rating, approved_at,
    image_url
  ) values (
    btrim(p_content),
    nullif(btrim(coalesce(p_subject_name, '')), ''),
    nullif(btrim(coalesce(p_location, '')), ''),
    true, 'approved', false,
    -- Verdict columns: -1 milk / 0 none / +1 juice. NOT 1..5 stars.
    greatest(-1, least(1, coalesce(p_communication, 0))),
    greatest(-1, least(1, coalesce(p_loyalty, 0))),
    greatest(-1, least(1, coalesce(p_vibe, 0))),
    greatest(-1, least(1, coalesce(p_emotional_safety, 0))),
    now(),
    nullif(btrim(coalesce(p_image_url, '')), '')
  )
  returning id into new_id;
  return new_id;
end;
$function$;

-- ---------------------------------------------------------------------------
-- 2. Bulk insert
-- ---------------------------------------------------------------------------
-- Each array element accepts:
--   content      text     (required)
--   subject_name text     optional
--   location     text     optional, "Austin, TX" — resolved to city_id when it matches
--   verdict      integer  -1 milk / 0 none / +1 juice
--   image_url    text     JSON-array-of-paths string, same shape the normal post flow writes
--   minutes_ago  integer  how far back to date the row (default: staggered by position)
create or replace function public.admin_create_seed_stories_bulk(p_stories jsonb)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  item jsonb;
  idx integer := 0;
  inserted integer := 0;
  v_content text;
  v_location text;
  v_city_part text;
  v_state_part text;
  v_state_full text;
  v_city_id uuid;
  v_minutes integer;
  v_created timestamptz;
  -- cities.state_province stores full names ("Texas"), but the seed UI prompts for
  -- "Austin, TX" and that's how anyone will type it. Expand before matching.
  k_states constant jsonb := '{
    "AL":"Alabama","AK":"Alaska","AZ":"Arizona","AR":"Arkansas","CA":"California",
    "CO":"Colorado","CT":"Connecticut","DE":"Delaware","DC":"District of Columbia",
    "FL":"Florida","GA":"Georgia","HI":"Hawaii","ID":"Idaho","IL":"Illinois",
    "IN":"Indiana","IA":"Iowa","KS":"Kansas","KY":"Kentucky","LA":"Louisiana",
    "ME":"Maine","MD":"Maryland","MA":"Massachusetts","MI":"Michigan","MN":"Minnesota",
    "MS":"Mississippi","MO":"Missouri","MT":"Montana","NE":"Nebraska","NV":"Nevada",
    "NH":"New Hampshire","NJ":"New Jersey","NM":"New Mexico","NY":"New York",
    "NC":"North Carolina","ND":"North Dakota","OH":"Ohio","OK":"Oklahoma","OR":"Oregon",
    "PA":"Pennsylvania","RI":"Rhode Island","SC":"South Carolina","SD":"South Dakota",
    "TN":"Tennessee","TX":"Texas","UT":"Utah","VT":"Vermont","VA":"Virginia",
    "WA":"Washington","WV":"West Virginia","WI":"Wisconsin","WY":"Wyoming"
  }'::jsonb;
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'forbidden';
  end if;
  if p_stories is null or jsonb_typeof(p_stories) <> 'array' then
    raise exception 'p_stories must be a json array';
  end if;
  if jsonb_array_length(p_stories) > 50 then
    raise exception 'batch too large (max 50)';
  end if;

  for item in select * from jsonb_array_elements(p_stories) loop
    idx := idx + 1;
    v_content := btrim(coalesce(item ->> 'content', ''));
    -- Skip blanks rather than aborting the batch — a stray empty row in the
    -- admin editor shouldn't cost the operator the other 29 stories.
    continue when v_content = '';

    v_location := nullif(btrim(coalesce(item ->> 'location', '')), '');

    -- Resolve city_id so seeds show up under the "my city" feed scope. Best effort:
    -- an unmatched location still stores the free-text location, just without a city.
    v_city_id := null;
    if v_location is not null then
      v_city_part := btrim(split_part(v_location, ',', 1));
      v_state_part := nullif(btrim(split_part(v_location, ',', 2)), '');
      v_state_full := coalesce(k_states ->> upper(coalesce(v_state_part, '')), v_state_part);

      select c.id into v_city_id
      from public.cities c
      where lower(c.city_name) = lower(v_city_part)
        and (
          v_state_full is null
          or lower(c.state_province) = lower(v_state_full)
        )
      order by c.population desc nulls last
      limit 1;

      -- Fall back to city name alone when the state doesn't line up (misspelled,
      -- abbreviated oddly, or a city we store under a different state string).
      if v_city_id is null then
        select c.id into v_city_id
        from public.cities c
        where lower(c.city_name) = lower(v_city_part)
        order by c.population desc nulls last
        limit 1;
      end if;
    end if;

    -- Default stagger: 47 minutes apart, newest first, so a batch reads like a
    -- feed that filled in over time instead of all at once.
    v_minutes := coalesce((item ->> 'minutes_ago')::integer, idx * 47);
    v_created := now() - make_interval(mins => greatest(0, v_minutes));

    insert into public.stories (
      content, subject_name, location, city_id, is_seed, status, submitted_anonymously,
      communication_rating, loyalty_rating, overall_vibe_rating, emotional_safety_rating,
      approved_at, created_at, updated_at, image_url
    ) values (
      v_content,
      nullif(btrim(coalesce(item ->> 'subject_name', '')), ''),
      v_location,
      v_city_id,
      true, 'approved', false,
      0, 0,
      greatest(-1, least(1, coalesce((item ->> 'verdict')::integer, 0))),
      0,
      v_created, v_created, v_created,
      nullif(btrim(coalesce(item ->> 'image_url', '')), '')
    );
    inserted := inserted + 1;
  end loop;

  return inserted;
end;
$function$;

-- Grants: functions default to EXECUTE for PUBLIC, so revoking from anon alone is a no-op.
-- Revoke from PUBLIC, then re-grant the roles that actually need it. (has_role() inside the
-- function is the real gate; this just keeps the surface area honest.)
revoke execute on function public.admin_create_seed_stories_bulk(p_stories jsonb) from public, anon;
grant execute on function public.admin_create_seed_stories_bulk(p_stories jsonb) to authenticated, service_role;

revoke execute on function public.admin_create_seed_story(p_content text, p_subject_name text, p_location text, p_communication integer, p_loyalty integer, p_vibe integer, p_emotional_safety integer, p_image_url text) from public, anon;
grant execute on function public.admin_create_seed_story(p_content text, p_subject_name text, p_location text, p_communication integer, p_loyalty integer, p_vibe integer, p_emotional_safety integer, p_image_url text) to authenticated, service_role;
