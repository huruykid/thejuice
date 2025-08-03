-- Function to normalize phone numbers to E.164 format
CREATE OR REPLACE FUNCTION public.normalize_phone_number(phone_input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Return null if input is null or empty
  IF phone_input IS NULL OR trim(phone_input) = '' THEN
    RETURN NULL;
  END IF;
  
  -- Remove all non-digit characters except +
  phone_input := regexp_replace(phone_input, '[^\d+]', '', 'g');
  
  -- If it starts with +, keep it as is (assuming it's already in international format)
  IF phone_input ~ '^\+\d{1,15}$' THEN
    RETURN phone_input;
  END IF;
  
  -- If it starts with 1 and has 11 digits, add + (US/Canada)
  IF phone_input ~ '^1\d{10}$' THEN
    RETURN '+' || phone_input;
  END IF;
  
  -- If it has 10 digits, assume US/Canada and add +1
  IF phone_input ~ '^\d{10}$' THEN
    RETURN '+1' || phone_input;
  END IF;
  
  -- If it doesn't match expected patterns, return as is with + prefix
  IF phone_input ~ '^\d{7,15}$' THEN
    RETURN '+' || phone_input;
  END IF;
  
  -- Return null for invalid formats
  RETURN NULL;
END;
$$;

-- Function to normalize phone numbers before insert/update
CREATE OR REPLACE FUNCTION public.normalize_profile_phone()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Normalize phone number if provided
  IF NEW.phone_number IS NOT NULL THEN
    NEW.phone_number := public.normalize_phone_number(NEW.phone_number);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for profiles table
DROP TRIGGER IF EXISTS normalize_profile_phone_trigger ON public.profiles;
CREATE TRIGGER normalize_profile_phone_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_profile_phone();

-- Function to normalize subject phone numbers in stories
CREATE OR REPLACE FUNCTION public.normalize_story_subject_phone()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Normalize subject phone number if provided
  IF NEW.subject_phone IS NOT NULL THEN
    NEW.subject_phone := public.normalize_phone_number(NEW.subject_phone);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for stories table
DROP TRIGGER IF EXISTS normalize_story_subject_phone_trigger ON public.stories;
CREATE TRIGGER normalize_story_subject_phone_trigger
  BEFORE INSERT OR UPDATE ON public.stories
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_story_subject_phone();

-- Update existing phone numbers to E.164 format
UPDATE public.profiles 
SET phone_number = public.normalize_phone_number(phone_number)
WHERE phone_number IS NOT NULL AND phone_number != '';

UPDATE public.stories 
SET subject_phone = public.normalize_phone_number(subject_phone)
WHERE subject_phone IS NOT NULL AND subject_phone != '';