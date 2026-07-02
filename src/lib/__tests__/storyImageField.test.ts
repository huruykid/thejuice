import { describe, it, expect, vi } from 'vitest';

// The hook module imports the supabase client (via the signed-url batcher),
// which touches localStorage — unavailable in the node test environment. The
// pure parser under test never uses it.
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));

import { parseStoryImageField } from '@/hooks/useStoryImageUrls';

describe('parseStoryImageField', () => {
  it('parses the standard JSON array of paths', () => {
    expect(parseStoryImageField('["uid/a.jpg","uid/b.png"]')).toEqual([
      'uid/a.jpg',
      'uid/b.png',
    ]);
  });

  it('filters out falsy entries in the array', () => {
    expect(parseStoryImageField('["uid/a.jpg", null, ""]')).toEqual(['uid/a.jpg']);
  });

  it('treats a non-JSON raw value as a single path (legacy rows)', () => {
    expect(parseStoryImageField('uid/legacy.jpg')).toEqual(['uid/legacy.jpg']);
  });

  it('handles a JSON string scalar', () => {
    expect(parseStoryImageField('"uid/only.jpg"')).toEqual(['uid/only.jpg']);
  });

  it('returns empty for null, undefined, and empty string', () => {
    expect(parseStoryImageField(null)).toEqual([]);
    expect(parseStoryImageField(undefined)).toEqual([]);
    expect(parseStoryImageField('')).toEqual([]);
  });

  it('handles legacy full public URLs as single entries', () => {
    const url =
      'https://proj.supabase.co/storage/v1/object/public/story-images/uid/x.jpg';
    expect(parseStoryImageField(url)).toEqual([url]);
  });
});
