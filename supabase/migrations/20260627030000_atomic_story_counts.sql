-- Authoritative story counts via triggers, replacing the racy client read-modify-write
-- (select count -> compute +/-1 -> update), which lost increments under concurrency.
-- The trigger RECOMPUTES the count from the actual rows on every change, so the
-- denormalized count can never drift and self-heals even if a stale client (during a
-- deploy window) also tries to maintain it. SECURITY DEFINER so the reactor/commenter
-- (who may not own the story) can still have the count updated past RLS on stories.

CREATE OR REPLACE FUNCTION public.sync_story_reactions_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sid uuid := COALESCE(NEW.story_id, OLD.story_id);
BEGIN
  UPDATE public.stories
  SET reactions_count = (SELECT count(*) FROM public.reactions WHERE story_id = sid)
  WHERE id = sid;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_story_comments_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sid uuid := COALESCE(NEW.story_id, OLD.story_id);
BEGIN
  UPDATE public.stories
  SET comments_count = (SELECT count(*) FROM public.comments WHERE story_id = sid)
  WHERE id = sid;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_reactions_count ON public.reactions;
CREATE TRIGGER trg_sync_reactions_count
  AFTER INSERT OR DELETE ON public.reactions
  FOR EACH ROW EXECUTE FUNCTION public.sync_story_reactions_count();

DROP TRIGGER IF EXISTS trg_sync_comments_count ON public.comments;
CREATE TRIGGER trg_sync_comments_count
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.sync_story_comments_count();

-- One-time reconciliation of any drift that already accumulated.
UPDATE public.stories s
SET reactions_count = (SELECT count(*) FROM public.reactions r WHERE r.story_id = s.id),
    comments_count  = (SELECT count(*) FROM public.comments  c WHERE c.story_id = s.id);
