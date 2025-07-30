-- Fix the story validation trigger to handle nullable ratings
CREATE OR REPLACE FUNCTION public.validate_story_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Validate content
  IF NOT public.validate_story_content(NEW.content) THEN
    RAISE EXCEPTION 'Invalid story content';
  END IF;
  
  -- Validate ratings only if they are provided (not null)
  IF NEW.communication_rating IS NOT NULL AND (NEW.communication_rating < 1 OR NEW.communication_rating > 5) THEN
    RAISE EXCEPTION 'Communication rating must be between 1 and 5';
  END IF;
  
  IF NEW.loyalty_rating IS NOT NULL AND (NEW.loyalty_rating < 1 OR NEW.loyalty_rating > 5) THEN
    RAISE EXCEPTION 'Loyalty rating must be between 1 and 5';
  END IF;
  
  IF NEW.emotional_safety_rating IS NOT NULL AND (NEW.emotional_safety_rating < 1 OR NEW.emotional_safety_rating > 5) THEN
    RAISE EXCEPTION 'Emotional safety rating must be between 1 and 5';
  END IF;
  
  IF NEW.overall_vibe_rating IS NOT NULL AND (NEW.overall_vibe_rating < 1 OR NEW.overall_vibe_rating > 5) THEN
    RAISE EXCEPTION 'Overall vibe rating must be between 1 and 5';
  END IF;
  
  RETURN NEW;
END;
$function$;