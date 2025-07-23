import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Heart, Filter } from "lucide-react";
import Navigation from "@/components/Navigation";
import CreateStory from "@/components/CreateStory";

const Comments = () => {
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [filter, setFilter] = useState<"all" | "received" | "given">("all");

  // Mock comments data - in real app this would come from Supabase
  const comments = [
    {
      id: 1,
      storyTitle: "Coffee Shop Cutie",
      comment: "This is so sweet! Did you get their number?",
      author: "TeaLover23",
      timeAgo: "2 hours ago",
      likes: 5,
      type: "received"
    },
    {
      id: 2,
      storyTitle: "Gym Crush Chronicles",
      comment: "Been there! The gym tension is real 😅",
      author: "FitnessQueen",
      timeAgo: "5 hours ago",
      likes: 12,
      type: "received"
    },
    {
      id: 3,
      storyTitle: "Bookstore Romance",
      comment: "Love this story! Any update?",
      author: "BookwormBae",
      timeAgo: "1 day ago",
      likes: 8,
      type: "given"
    }
  ];

  const filteredComments = comments.filter(comment => 
    filter === "all" || comment.type === filter
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-juice-orange/5 to-juice-pink/5 pb-20">
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Comments</h1>
            <p className="text-muted-foreground">Recent activity</p>
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={filter === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("all")}
            className="flex-1"
          >
            All
          </Button>
          <Button
            variant={filter === "received" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("received")}
            className="flex-1"
          >
            Received
          </Button>
          <Button
            variant={filter === "given" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("given")}
            className="flex-1"
          >
            Given
          </Button>
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          {filteredComments.map((comment) => (
            <Card key={comment.id} className="border-l-4 border-l-juice-orange/30">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-sm font-medium text-juice-orange">
                      {comment.storyTitle}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        by {comment.author}
                      </span>
                      <Badge 
                        variant={comment.type === "received" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {comment.type}
                      </Badge>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {comment.timeAgo}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-foreground mb-3">
                  {comment.comment}
                </p>
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="sm" className="h-auto p-0">
                    <Heart className="h-4 w-4 mr-1" />
                    <span className="text-xs">{comment.likes}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="h-auto p-0">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    <span className="text-xs">Reply</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredComments.length === 0 && (
          <div className="text-center py-12">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No comments yet
            </h3>
            <p className="text-muted-foreground mb-6">
              Start engaging with stories to see comments here
            </p>
            <Button onClick={() => setShowCreateStory(true)}>
              Share a Story
            </Button>
          </div>
        )}
      </div>

      <Navigation />
      
      {showCreateStory && (
        <CreateStory onClose={() => setShowCreateStory(false)} />
      )}
    </div>
  );
};

export default Comments;