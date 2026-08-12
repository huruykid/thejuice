/**
 * One place that decides whose name goes on a story.
 *
 * Most stories are attributed through the author's profile codename. Operator-authored
 * posts carry a per-story `author_alias` instead (see the author_alias migration): their
 * `profile_id`/`user_id` are NULL, so the alias is the only handle they have, and it is
 * a different one on every post.
 *
 * Everything that renders "@someone" on a story goes through here — the fallback order
 * has to be identical everywhere or the same story reads as two different people.
 */
export interface StoryAuthorFields {
  author_alias?: string | null;
  profiles?: { anonymous_username?: string | null } | null;
}

export const ANONYMOUS_AUTHOR = "Anonymous";

export const getStoryAuthorName = (
  story: StoryAuthorFields | null | undefined,
  fallback: string = ANONYMOUS_AUTHOR
): string => story?.author_alias || story?.profiles?.anonymous_username || fallback;
