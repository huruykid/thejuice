-- Add phone number field to profiles table for user search functionality
-- Phone numbers will not be displayed publicly but can be used for user search

ALTER TABLE public.profiles 
ADD COLUMN phone_number TEXT;

-- Create index for phone number searches (partial index for non-null values)
CREATE INDEX idx_profiles_phone_number ON public.profiles(phone_number) WHERE phone_number IS NOT NULL;

-- Add constraint to ensure phone numbers are in a consistent format if provided
-- This allows various formats but ensures consistency
ALTER TABLE public.profiles 
ADD CONSTRAINT valid_phone_format CHECK (
  phone_number IS NULL OR 
  phone_number ~ '^\+?[1-9]\d{1,14}$' OR 
  phone_number ~ '^[0-9\-\(\)\s\+\.]{10,}$'
);