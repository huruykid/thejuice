import { describe, it, expect, vi } from 'vitest';

// The hook module imports the supabase client, which touches localStorage —
// unavailable in the node test environment. The pure function under test
// never uses it.
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));

import { groupStoriesBySubject } from '@/hooks/useSubjectLookup';
import type { Story } from '@/hooks/useStories';

const story = (overrides: Partial<Story>): Story =>
  ({
    id: Math.random().toString(36).slice(2),
    content: 'a story',
    story_tags: [],
    created_at: new Date().toISOString(),
    ...overrides,
  }) as Story;

describe('groupStoriesBySubject', () => {
  it('groups case-insensitively and trims whitespace', () => {
    const groups = groupStoriesBySubject([
      story({ subject_name: 'Sarah M.' }),
      story({ subject_name: '  sarah m. ' }),
      story({ subject_name: 'SARAH M.' }),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].count).toBe(3);
    // Display name keeps first-seen casing.
    expect(groups[0].name).toBe('Sarah M.');
    expect(groups[0].stories).toHaveLength(3);
  });

  it('tallies green/red from the ±1 verdict and ignores 0/null', () => {
    const groups = groupStoriesBySubject([
      story({ subject_name: 'Ana', overall_vibe_rating: 1 }),
      story({ subject_name: 'Ana', overall_vibe_rating: 1 }),
      story({ subject_name: 'Ana', overall_vibe_rating: -1 }),
      story({ subject_name: 'Ana', overall_vibe_rating: 0 }),
      story({ subject_name: 'Ana', overall_vibe_rating: null }),
    ]);
    expect(groups[0].count).toBe(5);
    expect(groups[0].green).toBe(2);
    expect(groups[0].red).toBe(1);
  });

  it('sorts the most-reviewed subject first', () => {
    const groups = groupStoriesBySubject([
      story({ subject_name: 'Rare' }),
      story({ subject_name: 'Popular' }),
      story({ subject_name: 'Popular' }),
      story({ subject_name: 'Popular' }),
    ]);
    expect(groups.map((g) => g.name)).toEqual(['Popular', 'Rare']);
  });

  it('skips stories with missing or blank subject names', () => {
    const groups = groupStoriesBySubject([
      story({ subject_name: undefined }),
      story({ subject_name: '   ' }),
      story({ subject_name: 'Kept' }),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe('Kept');
  });

  it('returns an empty array for no stories', () => {
    expect(groupStoriesBySubject([])).toEqual([]);
  });
});
