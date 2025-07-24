import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Bell, User, MessageCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import LoadingSkeleton from "@/components/ui/loading-skeleton";
import { useUserActivity } from "@/hooks/useUserActivity";
import { formatDistanceToNow } from "date-fns";

const Activity = () => {
  const navigate = useNavigate();
  const { activities, isLoading } = useUserActivity();

  const handleActivityTap = (storyId: string) => {
    // Navigate to the specific story - you might want to create a story detail page
    // For now, navigate to explore with the story in focus
    navigate(`/explore?story=${storyId}`);
  };

  const getInitials = (username: string) => {
    return username
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-juice-orange/5 to-juice-pink/5 pb-20">
        <div className="container mx-auto px-4 py-6 max-w-md">
          {/* Header */}
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="mr-3"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Bell className="h-6 w-6 text-juice-orange" />
              <h1 className="text-2xl font-bold text-foreground">Activity</h1>
            </div>
          </div>

          {/* Loading skeletons */}
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="border-juice-orange/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 bg-muted rounded-full animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                      <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                      <div className="h-8 bg-muted/50 rounded animate-pulse" />
                      <div className="h-2 bg-muted rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <Navigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-juice-orange/5 to-juice-pink/5 pb-20">
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="mr-3"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Bell className="h-6 w-6 text-juice-orange" />
            <h1 className="text-2xl font-bold text-foreground">Activity</h1>
          </div>
        </div>

        {/* Subtitle */}
        <div className="text-center mb-6">
          <p className="text-muted-foreground">Your Juice House</p>
        </div>

        {/* Activity Feed */}
        <div className="space-y-3">
          {activities.length === 0 ? (
            <Card className="border-juice-orange/20">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-juice-orange/20 to-juice-pink/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <MessageCircle className="h-8 w-8 text-juice-orange" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
                <p className="text-muted-foreground text-sm">
                  When someone comments on your stories, you'll see the activity here.
                </p>
              </CardContent>
            </Card>
          ) : (
            activities.map((activity, index) => (
              <Card 
                key={activity.id} 
                className="border-juice-orange/20 hover:border-juice-orange/40 transition-colors cursor-pointer animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => handleActivityTap(activity.story_id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <Avatar className="h-10 w-10 border-2 border-gradient-primary">
                      <AvatarFallback className="bg-gradient-to-br from-juice-orange to-juice-pink text-white text-sm font-medium">
                        {getInitials(activity.commenter_username)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">
                          {activity.commenter_username}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          commented
                        </span>
                      </div>

                      {/* Comment preview */}
                      <p className="text-sm text-foreground mb-2 line-clamp-2">
                        "{activity.comment_content}"
                      </p>

                      {/* Story preview */}
                      <div className="bg-muted/30 rounded-lg p-2 mb-2">
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          On your story: {activity.story_content_preview}
                        </p>
                      </div>

                      {/* Timestamp */}
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </p>
                    </div>

                    {/* Arrow indicator */}
                    <div className="flex-shrink-0 text-muted-foreground">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Show more indicator */}
        {activities.length > 0 && (
          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              Showing recent activity
            </p>
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
};

export default Activity;