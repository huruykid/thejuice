import { TrendingUp, Hash } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useTrendingStories } from "@/hooks/useTrendingStories";
import { useTopTags } from "@/hooks/useTopTags";

const DesktopRightRail = () => {
  const navigate = useNavigate();
  const { data: trending } = useTrendingStories();
  const { data: topTags } = useTopTags();

  return (
    <aside className="hidden xl:flex flex-col w-80 shrink-0 sticky top-0 h-screen overflow-y-auto px-6 py-6 gap-6 border-l border-juice-orange/10">
      <div className="modern-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-juice-orange" />
          <h2 className="font-display font-semibold text-sm uppercase tracking-wide text-foreground">
            Trending now
          </h2>
        </div>
        <div className="space-y-3">
          {trending && trending.length > 0 ? (
            trending.slice(0, 5).map((story: any) => (
              <button
                key={story.id}
                onClick={() => navigate("/explore")}
                className="w-full text-left group"
              >
                <p className="text-sm text-foreground/90 line-clamp-2 group-hover:text-juice-orange transition-colors">
                  {story.content}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(story.reactions_count ?? 0)} reactions ·{" "}
                  {(story.comments_count ?? 0)} comments
                </p>
              </button>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No trending stories yet.
            </p>
          )}
        </div>
      </div>

      <div className="modern-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Hash className="h-4 w-4 text-juice-orange" />
          <h2 className="font-display font-semibold text-sm uppercase tracking-wide text-foreground">
            Top tags
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {topTags && topTags.length > 0 ? (
            topTags.slice(0, 10).map((tag) => (
              <Badge
                key={tag.tag}
                variant="secondary"
                className="cursor-pointer hover:bg-juice-orange/20 transition-colors"
                onClick={() => navigate("/explore")}
              >
                #{tag.tag}
              </Badge>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No tags yet.</p>
          )}
        </div>
      </div>
    </aside>
  );
};

export default DesktopRightRail;