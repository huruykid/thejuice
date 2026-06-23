
ALTER TABLE public.stories DROP CONSTRAINT IF EXISTS stories_communication_rating_check;
ALTER TABLE public.stories DROP CONSTRAINT IF EXISTS stories_loyalty_rating_check;
ALTER TABLE public.stories DROP CONSTRAINT IF EXISTS stories_emotional_safety_rating_check;
ALTER TABLE public.stories DROP CONSTRAINT IF EXISTS stories_overall_vibe_rating_check;
