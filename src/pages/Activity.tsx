import { useNavigate } from "react-router-dom";
import { MessageCircle, ChevronRight } from "lucide-react";
import PageScaffold from "@/components/layout/PageScaffold";
import { useUserActivity } from "@/hooks/useUserActivity";
import { formatDistanceToNow } from "date-fns";

/**
 * Activity feed — IG-bones: flush hairline rows inside the shared PageScaffold.
 * (Replaced the legacy gradient-card layout so the tap from Home's heart icon
 * lands in the same design language it left.)
 */
const Activity = () => {
  const navigate = useNavigate();
  const { activities, isLoading } = useUserActivity();

  const handleActivityTap = (storyId: string) => {
    navigate(`/explore?story=${storyId}`);
  };

  const getInitials = (username: string) =>
    username
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);

  return (
    <PageScaffold title="Activity" back>
      {isLoading ? (
        <div className="divide-y divide-border">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3">
              <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-muted" />
              <div className="flex-1 space-y-2 py-0.5">
                <div className="h-3.5 w-2/5 animate-pulse rounded bg-muted" />
                <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-muted/60" />
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="px-6 py-20 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <MessageCircle className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="mb-1 text-lg font-semibold">No activity yet</h3>
          <p className="text-sm text-muted-foreground">
            When someone flags or comments on your stories, you'll see it here.
          </p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-border">
            {activities.map((activity) => (
              <button
                key={activity.id}
                onClick={() => handleActivityTap(activity.story_id)}
                className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-card-hover"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
                  {getInitials(activity.commenter_username)}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-semibold text-foreground">
                      {activity.commenter_username}
                    </span>{" "}
                    <span className="text-muted-foreground">commented</span>{" "}
                    <span className="text-xs text-muted-foreground">
                      ·{" "}
                      {formatDistanceToNow(new Date(activity.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-foreground">
                    “{activity.comment_content}”
                  </p>
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                    On your story: {activity.story_content_preview}
                  </p>
                </div>

                <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>

          <div className="py-6 text-center text-xs text-muted-foreground">
            Showing recent activity
          </div>
        </>
      )}
    </PageScaffold>
  );
};

export default Activity;
