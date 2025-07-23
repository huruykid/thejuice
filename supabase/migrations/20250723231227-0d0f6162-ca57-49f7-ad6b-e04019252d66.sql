-- Add location field to stories table
ALTER TABLE public.stories 
ADD COLUMN location TEXT;

-- Add index for location-based queries
CREATE INDEX idx_stories_location ON public.stories(location);

-- Add index for trending queries (created_at + engagement)
CREATE INDEX idx_stories_trending ON public.stories(created_at DESC, reactions_count DESC, comments_count DESC);