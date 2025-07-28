-- Add view_count column to stories table
ALTER TABLE public.stories 
ADD COLUMN view_count integer NOT NULL DEFAULT 0;

-- Update existing stories with random view counts for demonstration
-- Set the first story to have 12,423 views as requested
UPDATE public.stories 
SET view_count = 12423 
WHERE id = (
    SELECT id 
    FROM public.stories 
    ORDER BY created_at DESC 
    LIMIT 1
);

-- Set other stories to have various view counts for realistic data
UPDATE public.stories 
SET view_count = FLOOR(RANDOM() * 5000 + 100)::integer 
WHERE view_count = 0;