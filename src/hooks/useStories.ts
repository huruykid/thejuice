import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Story {
  id: string;
  codename_id: string;
  content: string;
  communication_rating: number;
  loyalty_rating: number;
  emotional_safety_rating: number;
  overall_vibe_rating: number;
  reactions_count: number;
  comments_count: number;
  created_at: string;
  codenames: {
    id: string;
    display_name: string;
    emoji: string | null;
    description: string | null;
  };
  story_tags: Array<{
    tag: string;
  }>;
}

export interface Codename {
  id: string;
  display_name: string;
  emoji: string | null;
  description: string | null;
  created_at: string;
}

export const useStories = () => {
  return useQuery({
    queryKey: ['stories'],
    queryFn: async (): Promise<Story[]> => {
      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          codenames (
            id,
            display_name,
            emoji,
            description
          ),
          story_tags (
            tag
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};

export const useStoriesByCodename = (codenameId: string) => {
  return useQuery({
    queryKey: ['stories', 'codename', codenameId],
    queryFn: async (): Promise<Story[]> => {
      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          codenames (
            id,
            display_name,
            emoji,
            description
          ),
          story_tags (
            tag
          )
        `)
        .eq('codename_id', codenameId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};

export const useCodenames = () => {
  return useQuery({
    queryKey: ['codenames'],
    queryFn: async (): Promise<Codename[]> => {
      const { data, error } = await supabase
        .from('codenames')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};

export const useCodename = (codenameId: string) => {
  return useQuery({
    queryKey: ['codename', codenameId],
    queryFn: async (): Promise<Codename | null> => {
      const { data, error } = await supabase
        .from('codenames')
        .select('*')
        .eq('id', codenameId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
};

export const useCreateStory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      codenameId,
      content,
      tags,
      ratings,
      location,
    }: {
      codenameId: string;
      content: string;
      tags: string[];
      ratings: {
        communication: number;
        loyalty: number;
        emotionalSafety: number;
        overallVibe: number;
      };
      location?: string;
    }) => {
      // Create the story
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert({
          codename_id: codenameId,
          content,
          communication_rating: ratings.communication,
          loyalty_rating: ratings.loyalty,
          emotional_safety_rating: ratings.emotionalSafety,
          overall_vibe_rating: ratings.overallVibe,
          location: location || null,
        })
        .select()
        .single();

      if (storyError) throw storyError;

      // Add tags
      if (tags.length > 0) {
        const tagData = tags.map((tag) => ({
          story_id: story.id,
          tag,
        }));

        const { error: tagsError } = await supabase
          .from('story_tags')
          .insert(tagData);

        if (tagsError) throw tagsError;
      }

      return story;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });
};

export const useCreateCodename = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      displayName,
      emoji,
      description,
    }: {
      displayName: string;
      emoji?: string;
      description?: string;
    }) => {
      const { data, error } = await supabase
        .from('codenames')
        .insert({
          display_name: displayName,
          emoji: emoji || null,
          description: description || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['codenames'] });
    },
  });
};