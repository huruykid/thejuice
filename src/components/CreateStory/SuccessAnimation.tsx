import { Send, Sparkles } from "lucide-react";
import { JuiceIcon } from "@/components/icons/BrandVoteIcons";
import { Button } from "@/components/ui/button";

interface SuccessAnimationProps {
  /** Held until the selfie is approved (unverified poster) — the copy says so. */
  held?: boolean;
  /**
   * post_share experiment: the moment after publishing is peak pride. When provided, the
   * screen stays up with a share button and a Done button instead of auto-closing.
   */
  onShare?: () => void;
  onDone?: () => void;
}

const SuccessAnimation = ({ held = false, onShare, onDone }: SuccessAnimationProps) => {
  const interactive = !!onDone;
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary/20 to-primary/20 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="text-center animate-scale-in max-w-sm w-full">
        <div className="mb-6 animate-bounce flex justify-center">
          <JuiceIcon className="h-20 w-20" />
        </div>
        <div className="text-6xl mb-4">
          <Sparkles className="h-16 w-16 text-primary animate-pulse mx-auto" />
        </div>
        <h2 className="text-3xl font-bold text-primary mb-2">
          {held ? "Saved — one step left" : "Story submitted!"}
        </h2>
        <p className="text-lg text-muted-foreground">
          {held
            ? "It publishes the moment your selfie is approved."
            : "You'll see it go live once it's reviewed."}
        </p>

        {interactive && (
          <div className="mt-8 space-y-2">
            {onShare && (
              <>
                <Button onClick={onShare} className="w-full" size="lg">
                  <Send className="h-4 w-4 mr-2" />
                  Send Juice to the group chat
                </Button>
                <p className="text-xs text-muted-foreground">
                  Your post stays anonymous. The link just brings your boys in.
                </p>
              </>
            )}
            <Button onClick={onDone} variant="ghost" className="w-full">
              Done
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuccessAnimation;
