import { useState } from "react";
import Navigation from "@/components/Navigation";
import StoryCard from "@/components/StoryCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, TrendingUp, Clock } from "lucide-react";
import juiceLogo from "@/assets/juice-logo.png";

interface HomeProps {
  onCreateStory?: () => void;
}

const Home = ({ onCreateStory }: HomeProps) => {
  // Mock data for stories
  const mockStories = [
    {
      id: "1",
      content: "Met this person through mutual friends at a coffee shop. They seemed super charming at first, asking all the right questions and really listening to my answers. Three dates in, I found out they were still actively dating their ex 'to figure things out' 🙄 Should have trusted my gut when they were always on their phone...",
      tags: ["🚩Red Flag", "📱Phone Addict", "🤷‍♀️Mixed Signals"],
      ratings: {
        communication: 2,
        loyalty: 1,
        emotionalSafety: 2,
        overallVibe: 2,
      },
      reactions: 24,
      comments: 8,
      timeAgo: "2h ago",
    },
    {
      id: "2", 
      content: "Six months with J and honestly? They might be the one ✨ They remember my coffee order, check in when I'm stressed, and actually PLAN dates instead of just asking 'what do you want to do?' They surprised me last week with tickets to see my favorite artist. Still pinching myself!",
      tags: ["💯Loyal", "✨Thoughtful", "🎵Music Lover"],
      ratings: {
        communication: 5,
        loyalty: 5,
        emotionalSafety: 5,
        overallVibe: 5,
      },
      reactions: 156,
      comments: 23,
      timeAgo: "5h ago",
    },
    {
      id: "3",
      content: "Went on what I thought was a casual lunch date. They ordered the most expensive items on the menu, insisted on getting appetizers AND dessert, then conveniently 'forgot' their wallet. When I paid, they had the audacity to ask if we could stop by Target so they could grab some things 💸",
      tags: ["💸Gold Digger", "🚩Red Flag", "🎭Fake"],
      ratings: {
        communication: 3,
        loyalty: 1,
        emotionalSafety: 2,
        overallVibe: 1,
      },
      reactions: 89,
      comments: 31,
      timeAgo: "1d ago",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-lg border-b border-juice-blue/10 z-40">
        <div className="flex items-center justify-between p-4 max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <img src={juiceLogo} alt="Juice" className="h-8 w-8" />
            <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Juice
            </h1>
          </div>
          <Button variant="juice-outline" size="sm">
            Invite Friends
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Feed Tabs */}
        <Tabs defaultValue="latest" className="mb-6">
          <TabsList className="grid w-full grid-cols-3 bg-juice-lavender/50 rounded-2xl p-1">
            <TabsTrigger
              value="latest"
              className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-card flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              Latest
            </TabsTrigger>
            <TabsTrigger
              value="trending"
              className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-card flex items-center gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger
              value="curated"
              className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-card flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Curated
            </TabsTrigger>
          </TabsList>

          <TabsContent value="latest" className="mt-6">
            {mockStories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </TabsContent>

          <TabsContent value="trending" className="mt-6">
            <div className="text-center py-12">
              <Sparkles className="h-12 w-12 text-juice-blue mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Trending Stories
              </h3>
              <p className="text-muted-foreground">
                The hottest tea is brewing... Check back soon!
              </p>
            </div>
          </TabsContent>

          <TabsContent value="curated" className="mt-6">
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 text-juice-blue mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Curated Collection
              </h3>
              <p className="text-muted-foreground">
                Hand-picked stories for your reading pleasure
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Navigation onCreateStory={onCreateStory} />
    </div>
  );
};

export default Home;