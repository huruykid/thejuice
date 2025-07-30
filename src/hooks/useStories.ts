import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeText, validateStoryContent, validateRating, validateTag } from '@/lib/security';

export interface Story {
  id: string;
  profile_id: string;
  content: string;
  communication_rating: number | null;
  loyalty_rating: number | null;
  emotional_safety_rating: number | null;
  overall_vibe_rating: number | null;
  reactions_count: number;
  comments_count: number;
  view_count: number;
  created_at: string;
  user_id?: string;
  image_url?: string;
  subject_name?: string;
  profiles?: {
    id: string;
    anonymous_username: string;
  };
  story_tags: Array<{
    tag: string;
  }>;
}

export const useStories = () => {
  return useQuery({
    queryKey: ['stories'],
    queryFn: async (): Promise<Story[]> => {
      const { data, error } = await (supabase as any)
        .from('stories')
        .select(`
          *,
          profiles (
            id,
            anonymous_username
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

export const useStoriesByProfile = (profileId: string) => {
  return useQuery({
    queryKey: ['stories', 'profile', profileId],
    queryFn: async (): Promise<Story[]> => {
      const { data, error } = await (supabase as any)
        .from('stories')
        .select(`
          *,
          profiles (
            id,
            anonymous_username
          ),
          story_tags (
            tag
          )
        `)
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};

export const useCreateStory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      content,
      tags,
      location,
      imageUrl,
      subjectName,
      subjectPhone,
    }: {
      content: string;
      tags: string[];
      location?: string;
      imageUrl?: string;
      subjectName?: string;
      subjectPhone?: string;
    }) => {
      // Validate and sanitize input
      const contentValidation = validateStoryContent(content);
      if (!contentValidation.isValid) {
        throw new Error(contentValidation.error);
      }

      const sanitizedContent = sanitizeText(content);
      const sanitizedLocation = location ? sanitizeText(location) : null;
      const sanitizedSubjectName = subjectName ? sanitizeText(subjectName) : null;
      const sanitizedSubjectPhone = subjectPhone ? sanitizeText(subjectPhone) : null;

      // Validate and sanitize tags
      const sanitizedTags: string[] = [];
      for (const tag of tags) {
        const tagValidation = validateTag(tag);
        if (!tagValidation.isValid) {
          throw new Error(tagValidation.error);
        }
        sanitizedTags.push(sanitizeText(tag));
      }

      // Get current user
      const { data: { user } } = await (supabase as any).auth.getUser();
      if (!user) throw new Error('User must be authenticated');

      // Get user's profile
      const { data: profile, error: profileError } = await (supabase as any)
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Create the story
      const { data: story, error: storyError } = await (supabase as any)
        .from('stories')
        .insert({
          profile_id: profile.id,
          content: sanitizedContent,
          location: sanitizedLocation,
          image_url: imageUrl || null,
          subject_name: sanitizedSubjectName,
          subject_phone: sanitizedSubjectPhone,
          user_id: user.id,
        })
        .select()
        .single();

      if (storyError) throw storyError;

      // Add tags
      if (sanitizedTags.length > 0) {
        const tagData = sanitizedTags.map((tag) => ({
          story_id: story.id,
          tag,
        }));

        const { error: tagsError } = await (supabase as any)
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

export const useDeleteStory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (storyId: string) => {
      const { error } = await (supabase as any)
        .from('stories')
        .delete()
        .eq('id', storyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      queryClient.invalidateQueries({ queryKey: ['search-stories'] });
    },
  });
};