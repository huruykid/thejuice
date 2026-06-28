-- Add optional image support to the admin seed-story tool. Drop the old 7-arg signature and
-- recreate with p_image_url (defaulted) so the seed image picker can attach a story-images path.
drop function if exists public.admin_create_seed_story(text, text, text, integer, integer, integer, integer);

create or replace function public.admin_create_seed_story(
  p_content text,
  p_subject_name text default null,
  p_location text default null,
  p_communication integer default 3,
  p_loyalty integer default 3,
  p_vibe integer default 3,
  p_emotional_safety integer default 3,
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
    greatest(1, least(5, p_communication)),
    greatest(1, least(5, p_loyalty)),
    greatest(1, least(5, p_vibe)),
    greatest(1, least(5, p_emotional_safety)),
    now(),
    nullif(btrim(coalesce(p_image_url, '')), '')
  )
  returning id into new_id;
  return new_id;
end;
$function$;
