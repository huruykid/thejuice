import { describe, it, expect } from 'vitest';
import { getStoryAuthorName } from '@/lib/storyAuthor';

/**
 * The precedence here is the whole point of the helper: an operator post carries
 * BOTH a per-story alias and (in some query shapes) a joined profile row. If any
 * screen resolved those in the other order, the same story would show two
 * different authors depending on where you looked at it.
 */
describe('getStoryAuthorName', () => {
  it('prefers the per-story alias over a joined profile codename', () => {
    expect(
      getStoryAuthorName({
        author_alias: 'quietly_done',
        profiles: { anonymous_username: 'the_operator' },
      })
    ).toBe('quietly_done');
  });

  it('falls back to the profile codename for ordinary member posts', () => {
    expect(
      getStoryAuthorName({ author_alias: null, profiles: { anonymous_username: 'late_reply' } })
    ).toBe('late_reply');
  });

  it('falls back to Anonymous when a story has neither', () => {
    expect(getStoryAuthorName({ author_alias: null, profiles: null })).toBe('Anonymous');
    expect(getStoryAuthorName(undefined)).toBe('Anonymous');
  });

  it('honors a caller-supplied fallback', () => {
    expect(getStoryAuthorName(null, 'Unknown Author')).toBe('Unknown Author');
  });

  it('ignores an empty alias rather than rendering "@"', () => {
    expect(
      getStoryAuthorName({ author_alias: '', profiles: { anonymous_username: 'still_here' } })
    ).toBe('still_here');
  });
});
