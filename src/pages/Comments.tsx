import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, Heart, TrendingUp, Reply, Flame } from "lucide-react";
import Navigation from "@/components/Navigation";
import CreateStory from "@/components/CreateStory";

const Comments = () => {
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [activeSection, setActiveSection] = useState<"my" | "replies" | "hot">("my");

  // Mock data for My Comments
  const myComments = [
    {
      id: 1,
      storyTitle: "Coffee Shop Cutie",
      comment: "This happened to me too! Did you get their number?",
      timeAgo: "2 hours ago",
      likes: 12,
      replies: 3,
      codename: "BookLover23"
    },
    {
      id: 2,
      storyTitle: "Gym Crush Chronicles", 
      comment: "The gym tension is so real! I can relate 😅",
      timeAgo: "1 day ago",
      likes: 8,
      replies: 1,
      codename: "FitnessQueen"
    }
  ];

  // Mock data for Replies to Me
  const repliesToMe = [
    {
      id: 3,
      storyTitle: "Late Night Uber",
      originalComment: "Anyone else think this was risky?",
      reply: "Totally agree! Safety first always",
      replier: "NightOwl99",
      timeAgo: "3 hours ago",
      likes: 5
    },
    {
      id: 4,
      storyTitle: "First Date Disaster",
      originalComment: "Red flags everywhere! 🚩",
      reply: "RIGHT?? I would have left immediately",
      replier: "DatingExpert",
      timeAgo: "6 hours ago", 
      likes: 15
    }
  ];

  // Mock data for Hot Takes
  const hotTakes = [
    {
      id: 5,
      storyTitle: "Tinder Train Wreck",
      comment: "Not the love story we deserved, but the one we needed to read 💀",
      author: "SavageQueen",
      timeAgo: "12 hours ago",
      likes: 156,
      replies: 23,
      isVerified: true
    },
    {
      id: 6,
      storyTitle: "Instagram Slide Saga",
      comment: "This is why we can't have nice things on social media 😂",
      author: "TeaSpiller",
      timeAgo: "1 day ago",
      likes: 89,
      replies: 12,
      isVerified: false
    },
    {
      id: 7,
      storyTitle: "Workplace Romance",
      comment: "HR has entered the chat 👀",
      author: "OfficeGossip",
      timeAgo: "2 days ago",
      likes: 234,
      replies: 45,
      isVerified: true
    }
  ];

  const renderMyComments = () => (
    <div className="space-y-4">
      {myComments.map((comment) => (
        <Card key={comment.id} className="border-l-4 border-l-juice-orange/30">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-sm font-medium text-juice-orange">
                  {comment.storyTitle}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    to {comment.codename}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    My Comment
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
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4 text-juice-pink" />
                <span className="text-xs font-medium">{comment.likes}</span>
              </div>
              <div className="flex items-center gap-1">
                <Reply className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs">{comment.replies} replies</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderRepliesToMe = () => (
    <div className="space-y-4">
      {repliesToMe.map((item) => (
        <Card key={item.id} className="border-l-4 border-l-juice-pink/30">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-sm font-medium text-juice-orange">
                  {item.storyTitle}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {item.replier} replied to you
                  </span>
                  <Badge variant="default" className="text-xs bg-juice-pink">
                    Reply
                  </Badge>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                {item.timeAgo}
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Your comment:</p>
              <p className="text-sm">{item.originalComment}</p>
            </div>
            <div>
              <p className="text-sm text-foreground">
                {item.reply}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4 text-juice-pink" />
                <span className="text-xs font-medium">{item.likes}</span>
              </div>
              <Button variant="ghost" size="sm" className="h-auto p-0">
                <Reply className="h-4 w-4 mr-1" />
                <span className="text-xs">Reply back</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderHotTakes = () => (
    <div className="space-y-4">
      {hotTakes.map((comment) => (
        <Card key={comment.id} className="border-l-4 border-l-orange-500/50 bg-gradient-to-r from-orange-50/50 to-transparent dark:from-orange-950/20">
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
                  {comment.isVerified && (
                    <Badge variant="default" className="text-xs bg-orange-500">
                      <Flame className="h-3 w-3 mr-1" />
                      Hot Take
                    </Badge>
                  )}
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
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4 text-orange-500" />
                <span className="text-xs font-bold text-orange-600">{comment.likes}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs">{comment.replies} replies</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-orange-500" />
                <span className="text-xs text-orange-600">Trending</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const getCurrentData = () => {
    switch (activeSection) {
      case "my": return myComments;
      case "replies": return repliesToMe; 
      case "hot": return hotTakes;
      default: return [];
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-juice-orange/5 to-juice-pink/5 pb-20">
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Comments</h1>
            <p className="text-muted-foreground">Your Juice House</p>
          </div>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setShowCreateStory(true)}
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-1 mb-6 bg-muted/50 rounded-lg p-1">
          <Button
            variant={activeSection === "my" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveSection("my")}
            className="flex-1 text-xs"
          >
            <MessageCircle className="h-3 w-3 mr-1" />
            My Comments
          </Button>
          <Button
            variant={activeSection === "replies" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveSection("replies")}
            className="flex-1 text-xs"
          >
            <Reply className="h-3 w-3 mr-1" />
            Replies to Me
          </Button>
          <Button
            variant={activeSection === "hot" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveSection("hot")}
            className="flex-1 text-xs"
          >
            <Flame className="h-3 w-3 mr-1" />
            Hot Takes
          </Button>
        </div>

        {/* Section Headers */}
        <div className="mb-4">
          {activeSection === "my" && (
            <div>
              <h2 className="font-semibold text-foreground">My Comments</h2>
              <p className="text-sm text-muted-foreground">Comments you've made on stories</p>
            </div>
          )}
          {activeSection === "replies" && (
            <div>
              <h2 className="font-semibold text-foreground">Replies to Me</h2>
              <p className="text-sm text-muted-foreground">People responding to your comments</p>
            </div>
          )}
          {activeSection === "hot" && (
            <div>
              <h2 className="font-semibold text-foreground">Hot Takes 🔥</h2>
              <p className="text-sm text-muted-foreground">Most liked & trending comments on Juice</p>
            </div>
          )}
        </div>

        <Separator className="mb-6" />

        {/* Content */}
        {activeSection === "my" && renderMyComments()}
        {activeSection === "replies" && renderRepliesToMe()}
        {activeSection === "hot" && renderHotTakes()}

        {getCurrentData().length === 0 && (
          <div className="text-center py-12">
            {activeSection === "my" && <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />}
            {activeSection === "replies" && <Reply className="h-12 w-12 text-muted-foreground mx-auto mb-4" />}
            {activeSection === "hot" && <Flame className="h-12 w-12 text-muted-foreground mx-auto mb-4" />}
            
            <h3 className="text-lg font-medium text-foreground mb-2">
              {activeSection === "my" && "No comments yet"}
              {activeSection === "replies" && "No replies yet"}
              {activeSection === "hot" && "No hot takes yet"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {activeSection === "my" && "Start commenting on stories to see them here"}
              {activeSection === "replies" && "No one has replied to your comments yet"}
              {activeSection === "hot" && "Check back later for trending comments"}
            </p>
            {activeSection !== "hot" && (
              <Button onClick={() => setShowCreateStory(true)}>
                Share a Story
              </Button>
            )}
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