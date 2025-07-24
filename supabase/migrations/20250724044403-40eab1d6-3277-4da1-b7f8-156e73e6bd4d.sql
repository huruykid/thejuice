-- Add text search index for location column to improve partial matching performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stories_location_text_search 
ON public.stories USING gin(to_tsvector('english', coalesce(location, '')));

-- Add a more specific index for ILIKE operations on location
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stories_location_ilike 
ON public.stories USING gin(location gin_trgm_ops);