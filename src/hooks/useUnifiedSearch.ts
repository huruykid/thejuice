import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { parsePhoneNumber } from 'react-phone-number-input';
import { useToast } from '@/hooks/use-toast';

interface Story {
  id: string;
  content: string;
  subject_name: string | null;
  subject_phone: string | null;
  location: string | null;
  communication_rating: number | null;
  loyalty_rating: number | null;
  emotional_safety_rating: number | null;
  overall_vibe_rating: number | null;
  created_at: string;
  updated_at: string;
  reactions_count: number;
  comments_count: number;
  view_count: number;
  user_id: string;
  profile_id: string | null;
  image_url: string | null;
  profiles?: {
    id: string;
    anonymous_username: string;
  } | null;
  story_tags: { tag: string }[];
}

interface Profile {
  id: string;
  user_id: string;
  anonymous_username: string;
  phone_number: string | null;
  created_at: string;
  updated_at: string;
  date_of_birth: string | null;
  city: string | null;
  relationship_status: string | null;
}

interface UnifiedSearchResult {
  type: 'story' | 'profile';
  story?: Story;
  profile?: Profile;
  matchType: 'content' | 'username' | 'phone' | 'subject_name' | 'subject_phone';
}

export const useUnifiedSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UnifiedSearchResult[]>([]);
  const { toast } = useToast();

  const normalizePhoneNumber = (input: string): string | null => {
    try {
      const cleanInput = input.replace('@', '');
      const phoneNumber = parsePhoneNumber(cleanInput);
      
      if (phoneNumber && phoneNumber.isValid()) {
        return phoneNumber.format('E.164');
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const isPhoneNumberInput = (input: string): boolean => {
    const cleanInput = input.replace(/[@\s\-\(\)\.]/g, '');
    return /^[\+]?[\d\s\-\(\)\.]{7,}$/.test(input);
  };

  const searchAll = async (query: string): Promise<UnifiedSearchResult[]> => {
    if (!query || query.trim().length < 2) {
      return [];
    }

    setIsSearching(true);
    const results: UnifiedSearchResult[] = [];

    try {
      const trimmedQuery = query.trim();
      const isPhoneQuery = isPhoneNumberInput(trimmedQuery);
      const normalizedPhone = normalizePhoneNumber(trimmedQuery);
      
      // Search profiles by username
      if (!isPhoneQuery) {
        const usernameQuery = trimmedQuery.startsWith('@') 
          ? trimmedQuery.substring(1) 
          : trimmedQuery;

        const { data: profileResults, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .ilike('anonymous_username', `%${usernameQuery}%`);

        if (!profileError && profileResults) {
          profileResults.forEach(profile => {
            results.push({
              type: 'profile',
              profile,
              matchType: 'username'
            });
          });
        }
      }

      // Search profiles by phone number
      if (normalizedPhone) {
        const { data: phoneProfileResults, error: phoneProfileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('phone_number', normalizedPhone);

        if (!phoneProfileError && phoneProfileResults) {
          phoneProfileResults.forEach(profile => {
            results.push({
              type: 'profile',
              profile,
              matchType: 'phone'
            });
          });
        }
      }

      // Search stories by content
      if (!isPhoneQuery) {
        const { data: storyResults, error: storyError } = await supabase
          .from('stories')
          .select(`
            *,
            profiles!stories_profile_id_fkey(id, anonymous_username),
            story_tags(tag)
          `)
          .ilike('content', `%${trimmedQuery}%`)
          .limit(10);

        if (!storyError && storyResults) {
          storyResults.forEach(story => {
            results.push({
              type: 'story',
              story: {
                ...story,
                story_tags: story.story_tags || []
              },
              matchType: 'content'
            });
          });
        }
      }

      // Search stories by subject name
      if (!isPhoneQuery) {
        const usernameQuery = trimmedQuery.startsWith('@') 
          ? trimmedQuery.substring(1) 
          : trimmedQuery;

        const { data: subjectNameResults, error: subjectNameError } = await supabase
          .from('stories')
          .select(`
            *,
            profiles!stories_profile_id_fkey(id, anonymous_username),
            story_tags(tag)
          `)
          .ilike('subject_name', `%${usernameQuery}%`)
          .limit(5);

        if (!subjectNameError && subjectNameResults) {
          subjectNameResults.forEach(story => {
            results.push({
              type: 'story',
              story: {
                ...story,
                story_tags: story.story_tags || []
              },
              matchType: 'subject_name'
            });
          });
        }
      }

      // Search stories by subject phone
      if (normalizedPhone) {
        const { data: subjectPhoneResults, error: subjectPhoneError } = await supabase
          .from('stories')
          .select(`
            *,
            profiles!stories_profile_id_fkey(id, anonymous_username),
            story_tags(tag)
          `)
          .eq('subject_phone', normalizedPhone)
          .limit(5);

        if (!subjectPhoneError && subjectPhoneResults) {
          subjectPhoneResults.forEach(story => {
            results.push({
              type: 'story',
              story: {
                ...story,
                story_tags: story.story_tags || []
              },
              matchType: 'subject_phone'
            });
          });
        }
      }

    } catch (error) {
      console.error('Unified search error:', error);
      toast({
        title: "Search Error",
        description: "An error occurred while searching. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }

    // Remove duplicates and sort by relevance
    const uniqueResults = Array.from(
      new Map(
        results.map(item => [
          item.type === 'profile' ? `profile-${item.profile?.id}` : `story-${item.story?.id}`,
          item
        ])
      ).values()
    );

    return uniqueResults;
  };

  const performSearch = async (query: string) => {
    const results = await searchAll(query);
    setSearchResults(results);
    return results;
  };

  const clearResults = () => {
    setSearchResults([]);
  };

  return {
    isSearching,
    searchResults,
    performSearch,
    clearResults
  };
};