import { useState } from "react";
import Navigation from "@/components/Navigation";
import StoryCard from "@/components/StoryCard";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { useStories } from "@/hooks/useStories";
import { useAuth } from "@/hooks/useAuth";
import { useInvites } from "@/hooks/useInvites";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
interface HomeProps {
  onCreateStory?: () => void;
}
const Home = ({
  onCreateStory
}: HomeProps) => {
  const {
    data: stories = [],
    isLoading
  } = useStories();
  const {
    user
  } = useAuth();
  const {
    inviteStats,
    generateInvite,
    generatingInvite
  } = useInvites();
  const {
    toast
  } = useToast();
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
      const {
        data: existingCodes
      } = await supabase.from('invite_codes').select('code').eq('created_by', user.id).is('used_by', null).order('created_at', {
        ascending: false
      }).limit(1);
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
          description: "Your invite will be ready to share in a moment!"
        });

        // After a short delay, get the newest code and share it
        setTimeout(async () => {
          const {
            data: newCodes
          } = await supabase.from('invite_codes').select('code').eq('created_by', user.id).is('used_by', null).order('created_at', {
            ascending: false
          }).limit(1);
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
    const shareText = `Finally, men have a voice. Join the Tea App for Men - where the stories are real and the juice is anonymous.
👉 https://sipjuice.app

#fortheboys #teaappformen #getthejuice`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join The Tea App for Men!',
          text: shareText
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
        description: "Share this invite with your friends."
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
        description: "Share this invite with your friends."
      });
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-secondary to-background pb-20">
      {/* Modern Header with Glass Effect */}
      <div className="sticky top-0 z-40 glass border-b border-white/10">
        <div className="flex items-center justify-between p-4 max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src="/lovable-uploads/cf8e88b6-e6aa-4e2a-b0da-abdcf3e4641f.png" 
                alt="Juice" 
                className="h-10 w-10 rounded-2xl shadow-lg animate-float" 
              />
              <div className="absolute -inset-0.5 bg-gradient-primary rounded-2xl opacity-30 blur-sm"></div>
            </div>
            <h1 className="text-lg font-display font-bold gradient-text">
              The Juice App
            </h1>
          </div>
          <Button 
            variant="gradient" 
            size="sm" 
            onClick={handleInviteFriends} 
            disabled={generatingInvite || (inviteStats?.invites_remaining || 0) <= 0}
            className="shadow-glow"
          >
            {generatingInvite ? (
              <>
                <div className="animate-pulse">Generating...</div>
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" />
                Invite Friends
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Enhanced Content Section */}
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Stories Feed with Modern Layout */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-16">
              <div className="animate-pulse-glow">
                <div className="w-16 h-16 bg-gradient-primary rounded-3xl mx-auto mb-4 animate-bounce-in"></div>
                <div className="text-lg font-medium text-muted-foreground">Loading stories...</div>
              </div>
            </div>
          ) : stories.length === 0 ? (
            <div className="text-center py-16">
              <div className="modern-card p-8 max-w-sm mx-auto">
                <div className="text-6xl mb-6 animate-float">📝</div>
                <h3 className="text-xl font-display font-semibold text-foreground mb-3">
                  No stories yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Be the first to share your dating story and get the conversation started!
                </p>
                <Button 
                  variant="gradient" 
                  onClick={onCreateStory}
                  className="animate-bounce-in"
                >
                  Share Your Story
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {stories.map((story, index) => (
                <div 
                  key={story.id} 
                  className="animate-fade-in modern-card hover:shadow-glow transition-all duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <StoryCard 
                    story={story} 
                    authorName={story.profiles?.anonymous_username || 'Anonymous'} 
                    user_id={user?.id} 
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Navigation onCreateStory={onCreateStory} />
    </div>
  );
};
export default Home;