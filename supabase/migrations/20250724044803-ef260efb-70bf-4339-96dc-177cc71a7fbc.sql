-- Add user_id to stories table to track ownership
ALTER TABLE public.stories 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to comments table to track ownership  
ALTER TABLE public.comments
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create RLS policies for deleting owned stories
CREATE POLICY "Users can delete their own stories" 
ON public.stories 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for deleting owned comments
CREATE POLICY "Users can delete their own comments" 
ON public.comments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Update existing CREATE policies to automatically set user_id
DROP POLICY "Anyone can create stories" ON public.stories;
CREATE POLICY "Authenticated users can create stories" 
ON public.stories 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY "Anyone can create comments" ON public.comments;
CREATE POLICY "Authenticated users can create comments" 
ON public.comments 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);