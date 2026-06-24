import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import StoryCard from "@/components/StoryCard";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";
import type { Story } from "@/hooks/useStories";

const StoryDetail = () => {
  const { storyId } = useParams<{ storyId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Use story passed via navigation state only when the ID matches the URL param.
  // Without this check, browser history can replay an old state for a different story ID.
  const rawStateStory = (location.state as { story?: Story })?.story ?? null;
  const stateStory = rawStateStory?.id === storyId ? rawStateStory : null;

  const { data: fetchedStory, isLoading } = useQuery({
    queryKey: ["story", storyId],
    enabled: !stateStory && !!storyId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("stories")
        .select(`
          *,
          profiles:user_id (id, anonymous_username),
          story_tags (tag),
          cities:city_id (city_name, state_province, latitude, longitude)
        `)
        .eq("id", storyId!)
        .eq("status", "approved")
        .maybeSingle();
      if (error) throw error;
      return data as Story | null;
    },
  });

  const story = stateStory ?? fetchedStory;

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-8">
      {/* Back header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-2 px-2 h-12 max-w-xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="p-2 -ml-1 rounded-full hover:bg-muted transition-colors text-foreground"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
          </button>
          <span className="text-sm font-semibold">Story</span>
        </div>
      </header>

      <div className="max-w-xl mx-auto">
        {isLoading ? (
          <div className="px-4 py-20 text-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : !story ? (
          <div className="px-4 py-20 text-center text-sm text-muted-foreground">
            Story not found.
          </div>
        ) : (
          <StoryCard
            story={story}
            authorName={story.profiles?.anonymous_username ?? "Anonymous"}
            user_id={user?.id}
          />
        )}
      </div>

      <Navigation />
    </div>
  );
};

export default StoryDetail;
