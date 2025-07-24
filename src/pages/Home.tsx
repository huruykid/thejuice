
import { useState } from "react";
import Navigation from "@/components/Navigation";
import StoryCard from "@/components/StoryCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, TrendingUp, Clock, Share2 } from "lucide-react";
import { useStories } from "@/hooks/useStories";
import { useTrendingStories } from "@/hooks/useTrendingStories";
import { useAuth } from "@/hooks/useAuth";
import { useInvites } from "@/hooks/useInvites";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface HomeProps {
  onCreateStory?: () => void;
}

const Home = ({ onCreateStory }: HomeProps) => {
  const { data: stories = [], isLoading } = useStories();
  const { data: trendingStories = [], isLoading: isTrendingLoading } = useTrendingStories();
  const { user } = useAuth();
  const { inviteStats, generateInvite, generatingInvite } = useInvites();
  const { toast } = useToast();

  const handleInviteFriends = async () => {
    if (!inviteStats || inviteStats.invites_remaining <= 0) {
      toast({
        title: "No invites remaining",
        description: "You don't have any invites left to share.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Check for existing unused codes first
      if (!user) return;

      const { data: existingCodes } = await supabase
        .from('invite_codes')
        .select('code')
        .eq('created_by', user.id)
        .is('used_by', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (existingCodes && existingCodes.length > 0) {
        // Use existing code
        const code = existingCodes[0].code;
        shareInviteCode(code);
      } else {
        // Generate new code and then share it
        generateInvite();
        // Note: We'll handle sharing after generation completes
        // For now, let's show a message
        toast({
          title: "Generating invite code...",
          description: "Your invite will be ready to share in a moment!",
        });
        
        // After a short delay, get the newest code and share it
        setTimeout(async () => {
          const { data: newCodes } = await supabase
            .from('invite_codes')
            .select('code')
            .eq('created_by', user.id)
            .is('used_by', null)
            .order('created_at', { ascending: false })
            .limit(1);
          
          if (newCodes && newCodes.length > 0) {
            shareInviteCode(newCodes[0].code);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error handling invite:', error);
      toast({
        title: "Error",
        description: "Failed to generate invite. Please try again.",
        variant: "destructive"
      });
    }
  };

  const shareInviteCode = async (code: string) => {
    const baseUrl = window.location.origin;
    const inviteUrl = `${baseUrl}?invite=${code}`;
    const shareText = `You've just been invited to the Juice app! Share your story and learn from others. #fortheboys\n\nUse invite code: ${code}\nJoin here: ${inviteUrl}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join the Juice App!',
          text: shareText,
          url: inviteUrl
        });
      } catch (err) {
        // User cancelled sharing or error occurred
        if (err instanceof Error && err.name !== 'AbortError') {
          copyToClipboard(shareText);
        }
      }
    } else {
      // Fallback to copying
      copyToClipboard(shareText);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard!",
        description: "Share this invite with your friends.",
      });
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      toast({
        title: "Copied to clipboard!",
        description: "Share this invite with your friends.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-lg border-b border-juice-blue/10 z-40">
        <div className="flex items-center justify-between p-4 max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <img src="/lovable-uploads/cf8e88b6-e6aa-4e2a-b0da-abdcf3e4641f.png" alt="Juice" className="h-8 w-8" />
            <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              The Juice App
            </h1>
          </div>
          <Button 
            variant="juice-outline" 
            size="sm"
            onClick={handleInviteFriends}
            disabled={generatingInvite || (inviteStats?.invites_remaining || 0) <= 0}
          >
            {generatingInvite ? "Generating..." : "Invite Friends"}
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
            {isLoading ? (
              <div className="text-center py-12">
                <div className="text-lg">Loading stories...</div>
              </div>
            ) : stories.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📝</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No stories yet
                </h3>
                <p className="text-muted-foreground">
                  Be the first to share your dating story!
                </p>
              </div>
            ) : (
              stories.map((story) => (
                <StoryCard 
                  key={story.id} 
                  story={story} 
                  authorName={story.profiles?.anonymous_username || 'Anonymous'}
                  user_id={user?.id}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="trending" className="mt-6">
            {isTrendingLoading ? (
              <div className="text-center py-12">
                <div className="text-lg">Loading trending stories...</div>
              </div>
            ) : trendingStories.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-juice-blue mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No trending stories yet
                </h3>
                <p className="text-muted-foreground">
                  Stories need reactions to start trending!
                </p>
              </div>
            ) : (
              trendingStories.map((story) => (
                <StoryCard 
                  key={story.id} 
                  story={story} 
                  authorName={story.profiles?.anonymous_username || 'Anonymous'}
                  user_id={user?.id}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="curated" className="mt-6">
            <div className="text-center py-12">
              <Sparkles className="h-12 w-12 text-juice-blue mx-auto mb-4" />
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
