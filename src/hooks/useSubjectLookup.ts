import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBlockedUserIds } from '@/hooks/useBlockedUserIds';
import type { Story } from '@/hooks/useStories';

/**
 * Verified-user name lookup — the magic moment for members.
 *
 * Searches approved, real (non-seed) stories by subject name and groups them into one
 * row per person: review count, green/red tallies from poster verdicts
 * (overall_vibe_rating is +1 juice / -1 milk), and the full story rows so the caller can
 * expand a subject inline without a second fetch. Seed (fictional) stories are excluded —
 * a real name must never "match" invented content.
 */
export interface SubjectGroup {
  /** Display name — first-seen casing. */
  name: string;
  /** Normalized grouping key (lowercased, trimmed). */
  key: string;
  count: number;
  green: number;
  red: number;
  stories: Story[];
}

/** Pure grouping step — exported for tests. */
export function groupStoriesBySubject(stories: Story[]): SubjectGroup[] {
  const groups = new Map<string, SubjectGroup>();
  for (const story of stories) {
    const raw = (story.subject_name ?? '').trim();
    if (!raw) continue;
    const key = raw.toLowerCase();
    let group = groups.get(key);
    if (!group) {
      group = { name: raw, key, count: 0, green: 0, red: 0, stories: [] };
      groups.set(key, group);
    }
    group.count += 1;
    const verdict = story.overall_vibe_rating ?? 0;
    if (verdict > 0) group.green += 1;
    else if (verdict < 0) group.red += 1;
    group.stories.push(story);
  }
  // Most-reviewed first — the person with the most tea is the likeliest match.
  return [...groups.values()].sort((a, b) => b.count - a.count);
}

export const useSubjectLookup = (query: string) => {
  const { data: blockedIds = [] } = useBlockedUserIds();
  const q = query.trim();

  return useQuery({
    queryKey: ['subject-lookup', q, { blocked: blockedIds }],
    enabled: q.length >= 2,
    staleTime: 30_000,
    queryFn: async (): Promise<SubjectGroup[]> => {
      let dbQuery: any = supabase
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
        .eq('is_seed', false)
        .not('subject_name', 'is', null)
        .ilike('subject_name', `%${q.replace(/[%_]/g, '')}%`)
        .order('created_at', { ascending: false })
        .limit(50);
      if (blockedIds.length > 0) {
        dbQuery = dbQuery.not('user_id', 'in', `(${blockedIds.join(',')})`);
      }
      const { data, error } = await dbQuery;
      if (error) throw error;
      return groupStoriesBySubject((data ?? []) as Story[]);
    },
  });
};
