import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeText, validateStoryContent, validateRating, validateTag } from '@/lib/security';
import { useBlockedUserIds } from '@/hooks/useBlockedUserIds';
import { track } from '@/lib/analytics';

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
  location?: string | null;
  profiles?: {
    id: string;
    anonymous_username: string;
  };
  story_tags: Array<{
    tag: string;
  }>;
}

export const useStories = () => {
  const { data: blockedIds = [] } = useBlockedUserIds();
  return useQuery({
    queryKey: ['stories', { blocked: blockedIds }],
    queryFn: async (): Promise<Story[]> => {
      let query: any = supabase
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
        .eq('status', 'approved')
        .not('image_url', 'is', null)
        .order('created_at', { ascending: false });
      if (blockedIds.length > 0) {
        query = query.not('user_id', 'in', `(${blockedIds.join(',')})`);
      }
      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
  });
};

/**
 * Paginated stories feed. Uses Supabase `range()` to fetch a page at a time.
 * `getNextPageParam` returns `undefined` once we get fewer rows than the page size.
 */
export const STORIES_PAGE_SIZE = 12;

export type FeedMode = "community" | "seed";

export const useInfiniteStories = (
  pageSize: number = STORIES_PAGE_SIZE,
  mode: FeedMode = "community",
  enabled: boolean = true
) => {
  const { data: blockedIds = [] } = useBlockedUserIds();
  return useInfiniteQuery({
    queryKey: ['stories', 'infinite', pageSize, { blocked: blockedIds }],
    enabled,
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }): Promise<Story[]> => {
      const from = (pageParam as number) * pageSize;
      const to = from + pageSize - 1;
      let query: any = supabase
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
        .eq('status', 'approved')
        .not('image_url', 'is', null)
        .order('created_at', { ascending: false })
        .range(from, to);
      if (blockedIds.length > 0) {
        query = query.not('user_id', 'in', `(${blockedIds.join(',')})`);
      }
      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < pageSize ? undefined : allPages.length,
  });
};

export const useStoriesByProfile = (profileId: string) => {
  return useQuery({
    queryKey: ['stories', 'profile', profileId],
    queryFn: async (): Promise<Story[]> => {
      const { data, error } = await supabase
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
        .eq('status', 'approved')
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
      city_id,
      location,
      imageUrl,
      subjectName,
      subjectPhone,
      ratings,
    }: {
      content: string;
      tags: string[];
      city_id?: string | null;
      location?: string | null;
      imageUrl?: string;
      subjectName?: string;
      subjectPhone?: string;
      ratings?: {
        communication: number;
        loyalty: number;
        vibe: number;
        respect: number;
      };
    }) => {
      // Validate and sanitize input
      const contentValidation = validateStoryContent(content);
      if (!contentValidation.isValid) {
        throw new Error(contentValidation.error);
      }

      const sanitizedContent = sanitizeText(content);
      const sanitizedSubjectName = subjectName ? sanitizeText(subjectName) : null;
      const sanitizedSubjectPhone = subjectPhone ? sanitizeText(subjectPhone) : null;

      if (!imageUrl) {
        throw new Error('At least one photo is required to publish a story.');
      }

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User must be authenticated');

      // Server-side rate limit on posting. The bucket key + limits are enforced
      // server-side in check_rate_limit (keyed on auth.uid() here); the args are the
      // ignored-but-required RPC signature. Stops spam flooding the moderation queue.
      const { data: withinLimit } = await supabase.rpc('check_rate_limit', {
        p_identifier: user.id,
        p_action_type: 'story_create',
        p_max_attempts: 10,
        p_window_minutes: 60,
        p_block_minutes: 60,
      });
      if (withinLimit === false) {
        throw new Error("You're posting too fast — please wait a bit before sharing another story.");
      }

      // Get user's profile (may not exist for unverified users — they post as Anonymous)
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      // Create the story
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert({
          profile_id: profile?.id ?? null,
          content: sanitizedContent,
          city_id: city_id || null,
          location: location ? sanitizeText(location) : null,
          image_url: imageUrl || null,
          subject_name: sanitizedSubjectName,
          subject_phone: sanitizedSubjectPhone,
          user_id: user.id,
          communication_rating: ratings?.communication ?? 0,
          loyalty_rating: ratings?.loyalty ?? 0,
          overall_vibe_rating: ratings?.vibe ?? 0,
          emotional_safety_rating: ratings?.respect ?? 0,
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

        const { error: tagsError } = await supabase
          .from('story_tags')
          .insert(tagData);

        if (tagsError) throw tagsError;
      }

      return story;
    },
    onSuccess: (story) => {
      // Activation signal: a real (non-seed) post was submitted.
      void track("post_created", { story_id: story?.id, has_subject: !!story?.subject_name });
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      queryClient.invalidateQueries({ queryKey: ['stories', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['has-approved-post'] });
    },
  });
};

/**
 * Current user's own submissions, all statuses (pending/approved/rejected).
 * Used by UnverifiedHome's "Your submissions" list.
 */
export const useMySubmissions = (userId?: string) => {
  return useQuery({
    queryKey: ['stories', 'mine', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stories')
        .select('id, content, status, created_at, image_url')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Array<{
        id: string;
        content: string;
        status: 'pending' | 'approved' | 'rejected';
        created_at: string;
        image_url: string | null;
      }>;
    },
  });
};

export const useDeleteStory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (storyId: string) => {
      const { error } = await supabase
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