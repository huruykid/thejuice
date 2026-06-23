
CREATE OR REPLACE FUNCTION public.validate_story_before_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ratings now use signed flag values:
  --   -3..-1 = red flags (count = abs value)
  --    1..3  = green flags
  --    0     = not rated
  -- NULL is also allowed for backwards compatibility.
  IF NEW.communication_rating IS NOT NULL AND (NEW.communication_rating < -3 OR NEW.communication_rating > 5) THEN
    RAISE EXCEPTION 'Communication rating must be between -3 and 5';
  END IF;
  IF NEW.loyalty_rating IS NOT NULL AND (NEW.loyalty_rating < -3 OR NEW.loyalty_rating > 5) THEN
    RAISE EXCEPTION 'Loyalty rating must be between -3 and 5';
  END IF;
  IF NEW.emotional_safety_rating IS NOT NULL AND (NEW.emotional_safety_rating < -3 OR NEW.emotional_safety_rating > 5) THEN
    RAISE EXCEPTION 'Emotional safety rating must be between -3 and 5';
  END IF;
  IF NEW.overall_vibe_rating IS NOT NULL AND (NEW.overall_vibe_rating < -3 OR NEW.overall_vibe_rating > 5) THEN
    RAISE EXCEPTION 'Overall vibe rating must be between -3 and 5';
  END IF;

  RETURN NEW;
END;
$$;
