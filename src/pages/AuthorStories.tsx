import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import StoryCard from "@/components/StoryCard";
import { useStoriesByProfile } from "@/hooks/useStories";
import { useAuth } from "@/hooks/useAuth";

const AuthorStories = () => {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;

  const { data: stories, isLoading: storiesLoading } = useStoriesByProfile(profileId || '');

  if (!profileId) {
    return <div>Profile not found</div>;
  }

  const authorName = stories?.[0]?.profiles?.anonymous_username || 'Unknown Author';

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Navigation />
      
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Stories by {authorName}
            </h1>
            <p className="text-muted-foreground">
              {stories?.length || 0} {stories?.length === 1 ? 'story' : 'stories'}
            </p>
          </div>
        </div>

        {/* Stories */}
        {storiesLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-juice-orange mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading stories...</p>
          </div>
        ) : stories && stories.length > 0 ? (
          <div className="space-y-4">
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
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              This author hasn't posted any stories yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthorStories;