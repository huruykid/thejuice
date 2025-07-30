-- Make rating columns nullable so existing stories keep ratings but new stories don't require them
ALTER TABLE public.stories 
ALTER COLUMN communication_rating DROP NOT NULL,
ALTER COLUMN loyalty_rating DROP NOT NULL,
ALTER COLUMN emotional_safety_rating DROP NOT NULL,
ALTER COLUMN overall_vibe_rating DROP NOT NULL;