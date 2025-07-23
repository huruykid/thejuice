-- Create codenames table
CREATE TABLE public.codenames (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  display_name TEXT NOT NULL UNIQUE,
  emoji TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stories table
CREATE TABLE public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codename_id UUID NOT NULL REFERENCES public.codenames(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  communication_rating INTEGER NOT NULL CHECK (communication_rating >= 1 AND communication_rating <= 5),
  loyalty_rating INTEGER NOT NULL CHECK (loyalty_rating >= 1 AND loyalty_rating <= 5),
  emotional_safety_rating INTEGER NOT NULL CHECK (emotional_safety_rating >= 1 AND emotional_safety_rating <= 5),
  overall_vibe_rating INTEGER NOT NULL CHECK (overall_vibe_rating >= 1 AND overall_vibe_rating <= 5),
  reactions_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create story_tags table (many-to-many relationship)
CREATE TABLE public.story_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, tag)
);

-- Create reactions table
CREATE TABLE public.reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL DEFAULT 'like',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create comments table
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.codenames ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (anonymous app)
CREATE POLICY "Codenames are viewable by everyone" 
ON public.codenames FOR SELECT 
USING (true);

CREATE POLICY "Stories are viewable by everyone" 
ON public.stories FOR SELECT 
USING (true);

CREATE POLICY "Story tags are viewable by everyone" 
ON public.story_tags FOR SELECT 
USING (true);

CREATE POLICY "Reactions are viewable by everyone" 
ON public.reactions FOR SELECT 
USING (true);

CREATE POLICY "Comments are viewable by everyone" 
ON public.comments FOR SELECT 
USING (true);

-- Create policies for anonymous insert access
CREATE POLICY "Anyone can create codenames" 
ON public.codenames FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can create stories" 
ON public.stories FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can create story tags" 
ON public.story_tags FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can create reactions" 
ON public.reactions FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can create comments" 
ON public.comments FOR INSERT 
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_codenames_updated_at
  BEFORE UPDATE ON public.codenames
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stories_updated_at
  BEFORE UPDATE ON public.stories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_stories_codename_id ON public.stories(codename_id);
CREATE INDEX idx_story_tags_story_id ON public.story_tags(story_id);
CREATE INDEX idx_story_tags_tag ON public.story_tags(tag);
CREATE INDEX idx_reactions_story_id ON public.reactions(story_id);
CREATE INDEX idx_comments_story_id ON public.comments(story_id);

-- Insert some sample codenames
INSERT INTO public.codenames (display_name, emoji, description) VALUES
  ('💄MissVegas', '💄', 'Glamorous Vegas nights and dating adventures'),
  ('💼LA Exec', '💼', 'Corporate dating in the city of angels'),
  ('🎭Drama Queen', '🎭', 'When dating feels like a theatrical performance'),
  ('🏄‍♀️Beach Babe', '🏄‍♀️', 'Coastal dating vibes and surf town romance'),
  ('📚Book Worm', '📚', 'Intellectual connections and literary love');