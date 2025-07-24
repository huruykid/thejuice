-- Add index for ILIKE operations on location for better partial matching performance
CREATE INDEX IF NOT EXISTS idx_stories_location_partial_search 
ON public.stories(location text_pattern_ops);