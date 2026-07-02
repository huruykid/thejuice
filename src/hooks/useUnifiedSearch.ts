import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { parsePhoneNumber } from 'react-phone-number-input';
import { useToast } from '@/hooks/use-toast';
import { normalizeCityName } from '@/lib/citySearch';
import type { Story } from '@/hooks/useStories';

/**
 * Story search for Explore.
 *
 * Rewritten for speed (was 5+ sequential round-trips, including a full-table
 * scan of story locations for client-side fuzzy city matching, per search):
 *  - phone-like queries: ONE server-side hashed-phone RPC, nothing else
 *  - text queries: content, subject-name, and city matches run in PARALLEL
 *  - city matching is a single indexed ilike on normalized_location — no
 *    full-table location fetch, no per-city follow-up queries
 *  - profile search removed: Explore (the only consumer) discarded profile
 *    results, and returning members by phone number was a deanonymization
 *    vector anyway.
 */
interface UnifiedSearchResult {
  type: 'story';
  story: Story;
  matchType: 'content' | 'subject_name' | 'subject_phone' | 'city';
}

const STORY_SELECT = `
  *,
  profiles!stories_profile_id_fkey(id, anonymous_username),
  story_tags(tag)
`;

export const useUnifiedSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UnifiedSearchResult[]>([]);
  const { toast } = useToast();
  // Monotonic request id — a slow earlier search must not resolve after a
  // newer query and overwrite the visible results with stale ones.
  const requestIdRef = useRef(0);

  const normalizePhone = (input: string): string | null => {
    try {
      const parsed = parsePhoneNumber(input.replace('@', ''));
      return parsed && parsed.isValid() ? parsed.format('E.164') : null;
    } catch {
      return null;
    }
  };

  const isPhoneNumberInput = (input: string): boolean =>
    /^[\+]?[\d\s\-\(\)\.]{7,}$/.test(input);

  const toResult = (matchType: UnifiedSearchResult['matchType']) => (story: any): UnifiedSearchResult => ({
    type: 'story',
    story: { ...story, story_tags: story.story_tags || [] },
    matchType,
  });

  const searchAll = async (query: string): Promise<UnifiedSearchResult[]> => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];

    setIsSearching(true);
    const results: UnifiedSearchResult[] = [];

    try {
      const normalizedPhone = normalizePhone(trimmed);

      if (isPhoneNumberInput(trimmed) || normalizedPhone) {
        // Phone lookup — matched server-side against the one-way hash. The raw
        // number is never stored or queried from the client.
        if (normalizedPhone) {
          const { data, error } = await supabase.rpc('search_stories_by_phone', {
            p: normalizedPhone,
          });
          if (!error && Array.isArray(data)) results.push(...data.map(toResult('subject_phone')));
        }
      } else {
        const term = trimmed.startsWith('@') ? trimmed.substring(1) : trimmed;

        // All three matchers fire in parallel — one round-trip of latency, not three.
        const [byContent, bySubject, byCity] = await Promise.all([
          supabase
            .from('stories')
            .select(STORY_SELECT)
            .eq('status', 'approved')
            .ilike('content', `%${term}%`)
            .order('created_at', { ascending: false })
            .limit(10),
          supabase
            .from('stories')
            .select(STORY_SELECT)
            .eq('status', 'approved')
            .ilike('subject_name', `%${term}%`)
            .order('created_at', { ascending: false })
            .limit(10),
          supabase
            .from('stories')
            .select(STORY_SELECT)
            .eq('status', 'approved')
            .ilike('normalized_location', `%${normalizeCityName(term)}%`)
            .order('created_at', { ascending: false })
            .limit(10),
        ]);

        // Subject matches first — "is there tea on <name>" is the primary intent.
        if (!bySubject.error && bySubject.data) results.push(...bySubject.data.map(toResult('subject_name')));
        if (!byContent.error && byContent.data) results.push(...byContent.data.map(toResult('content')));
        if (!byCity.error && byCity.data) results.push(...byCity.data.map(toResult('city')));
      }
    } catch (error) {
      console.error('Unified search error:', error);
      toast({
        title: 'Search Error',
        description: 'An error occurred while searching. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }

    // Dedupe by story id, keeping the first (highest-priority) match type.
    const seen = new Set<string>();
    return results.filter((r) => {
      if (seen.has(r.story.id)) return false;
      seen.add(r.story.id);
      return true;
    });
  };

  const performSearch = async (query: string) => {
    const reqId = ++requestIdRef.current;
    const results = await searchAll(query);
    // Only apply if this is still the latest request; otherwise drop stale results.
    if (reqId === requestIdRef.current) {
      setSearchResults(results);
    }
    return results;
  };

  const clearResults = () => {
    requestIdRef.current++; // invalidate any in-flight search
    setSearchResults([]);
  };

  return {
    isSearching,
    searchResults,
    performSearch,
    clearResults,
  };
};
