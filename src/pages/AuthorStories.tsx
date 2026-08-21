import { useParams, useNavigate } from "react-router-dom";
import PageScaffold from "@/components/layout/PageScaffold";
import StoryCard from "@/components/StoryCard";
import StoryCardSkeleton from "@/components/StoryCardSkeleton";
import { useStoriesByProfile } from "@/hooks/useStories";
import { useAuth } from "@/hooks/useAuth";

const AuthorStories = () => {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;

  const { data: stories, isLoading: storiesLoading, isError } = useStoriesByProfile(profileId || '');

  const authorName = stories?.[0]?.profiles?.anonymous_username;
  const count = stories?.length || 0;

  return (
    <PageScaffold
      title={
        <span className="flex items-baseline gap-1.5">
          <span className="truncate">{authorName ? `@${authorName}` : "Stories"}</span>
          {count > 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              {count} {count === 1 ? "story" : "stories"}
            </span>
          )}
        </span>
      }
      back
      maxWidth="xl"
    >
      {storiesLoading ? (
        <div>
          {Array.from({ length: 3 }).map((_, i) => (
            <StoryCardSkeleton key={i} />
          ))}
        </div>
      ) : isError || !profileId ? (
        <div className="px-6 py-20 text-center">
          <h3 className="mb-1 text-lg font-semibold">Couldn't load stories</h3>
          <p className="mb-6 text-sm text-muted-foreground">
            The profile may not exist, or something went wrong.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Go back
          </button>
        </div>
      ) : stories && stories.length > 0 ? (
        <div>
          {stories.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              authorName={story.profiles?.anonymous_username || 'Anonymous'}
              subjectName={story.subject_name}
              user_id={currentUserId}
            />
          ))}
        </div>
      ) : (
        <div className="px-6 py-20 text-center">
          <h3 className="mb-1 text-lg font-semibold">Nothing here yet</h3>
          <p className="text-sm text-muted-foreground">
            This author hasn't posted any stories yet.
          </p>
        </div>
      )}
    </PageScaffold>
  );
};

export default AuthorStories;
