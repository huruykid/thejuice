-- Create storage bucket for story images
INSERT INTO storage.buckets (id, name, public) VALUES ('story-images', 'story-images', true);

-- Create policies for story images bucket
CREATE POLICY "Anyone can view story images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'story-images');

CREATE POLICY "Anyone can upload story images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'story-images');

CREATE POLICY "Anyone can update story images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'story-images');

CREATE POLICY "Anyone can delete story images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'story-images');

-- Add image_url column to stories table
ALTER TABLE public.stories ADD COLUMN image_url TEXT;