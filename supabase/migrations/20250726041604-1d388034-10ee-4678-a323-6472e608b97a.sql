-- Add subject_phone column to stories table to store phone numbers of people stories are about
ALTER TABLE public.stories ADD COLUMN subject_phone text;

-- Add index for better search performance
CREATE INDEX idx_stories_subject_phone ON public.stories (subject_phone);

-- Add validation function for subject phone numbers
CREATE OR REPLACE FUNCTION public.validate_subject_phone(phone_param text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Allow NULL or empty phone numbers
  IF phone_param IS NULL OR trim(phone_param) = '' THEN
    RETURN true;
  END IF;
  
  -- Basic phone number validation (allow various formats)
  -- Allows: +1234567890, (123) 456-7890, 123-456-7890, 123.456.7890, 1234567890
  RETURN phone_param ~ '^\+?1?[-.\s()]?(\d{3})[-.\s()]?(\d{3})[-.\s()]?(\d{4})$';
END;
$function$;

-- Add trigger for validation before insert/update
CREATE OR REPLACE FUNCTION public.validate_story_subject_phone()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Validate subject phone number if provided
  IF NEW.subject_phone IS NOT NULL AND NOT public.validate_subject_phone(NEW.subject_phone) THEN
    RAISE EXCEPTION 'Invalid subject phone number format';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger
CREATE TRIGGER validate_subject_phone_before_insert_update
  BEFORE INSERT OR UPDATE ON public.stories
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_story_subject_phone();