-- Function to normalize city names for better search
CREATE OR REPLACE FUNCTION public.normalize_city_name(city_input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Return null if input is null or empty
  IF city_input IS NULL OR trim(city_input) = '' THEN
    RETURN NULL;
  END IF;
  
  -- Convert to lowercase, remove extra spaces, and remove special characters
  city_input := lower(trim(city_input));
  -- Remove special characters but keep spaces, letters, and basic punctuation
  city_input := regexp_replace(city_input, '[^a-z0-9\s\-\.]', '', 'g');
  -- Replace multiple spaces with single space
  city_input := regexp_replace(city_input, '\s+', ' ', 'g');
  -- Trim again after cleanup
  city_input := trim(city_input);
  
  RETURN city_input;
END;
$$;

-- Add a normalized_location column to stories table for better search
ALTER TABLE public.stories 
ADD COLUMN IF NOT EXISTS normalized_location text;

-- Function to normalize city in stories before insert/update
CREATE OR REPLACE FUNCTION public.normalize_story_location()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Normalize location if provided
  IF NEW.location IS NOT NULL THEN
    NEW.normalized_location := public.normalize_city_name(NEW.location);
  ELSE
    NEW.normalized_location := NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for stories table location normalization
DROP TRIGGER IF EXISTS normalize_story_location_trigger ON public.stories;
CREATE TRIGGER normalize_story_location_trigger
  BEFORE INSERT OR UPDATE ON public.stories
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_story_location();

-- Update existing story locations to normalized format
UPDATE public.stories 
SET normalized_location = public.normalize_city_name(location)
WHERE location IS NOT NULL AND location != '';

-- Create index on normalized_location for faster searches
CREATE INDEX IF NOT EXISTS idx_stories_normalized_location 
ON public.stories(normalized_location) 
WHERE normalized_location IS NOT NULL;