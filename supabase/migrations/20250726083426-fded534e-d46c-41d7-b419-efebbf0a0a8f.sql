-- Add user_id column to reactions table
ALTER TABLE public.reactions ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL;

-- Create index for better performance on user reactions queries
CREATE INDEX idx_reactions_user_story ON public.reactions(user_id, story_id);

-- Update RLS policies to include user_id checks
DROP POLICY IF EXISTS "Verified users can create reactions" ON public.reactions;
DROP POLICY IF EXISTS "Reactions are viewable by everyone" ON public.reactions;

-- Create new RLS policies
CREATE POLICY "Verified users can create reactions" 
ON public.reactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND is_user_verified(auth.uid()));

CREATE POLICY "Reactions are viewable by everyone" 
ON public.reactions 
FOR SELECT 
USING (true);

CREATE POLICY "Users can delete their own reactions" 
ON public.reactions 
FOR DELETE 
USING (auth.uid() = user_id);