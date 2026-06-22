import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UnlockBannerProps {
  onCreateStory?: () => void;
}

/**
 * Shown above the seed feed for approved users who haven't posted yet.
 * Tapping the CTA opens the create-story flow.
 */
const UnlockBanner = ({ onCreateStory }: UnlockBannerProps) => {
  return (
    <div className="mx-3 mt-3 sm:mx-0 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <Lock className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            Post one story to unlock the community feed
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </h2>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            You're seeing rumored stories on public figures while you wait.
            Share one real experience (we review before it goes live) and the
            real community feed opens up.
          </p>
          {onCreateStory && (
            <Button
              size="sm"
              onClick={onCreateStory}
              className="mt-3 h-8 text-xs"
            >
              Share your story
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnlockBanner;