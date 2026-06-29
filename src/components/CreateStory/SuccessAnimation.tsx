import { Sparkles } from "lucide-react";
import { JuiceIcon } from "@/components/icons/BrandVoteIcons";

const SuccessAnimation = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary/20 to-primary/20 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center animate-scale-in">
        <div className="mb-6 animate-bounce flex justify-center">
          <JuiceIcon className="h-20 w-20" />
        </div>
        <div className="text-6xl mb-4">
          <Sparkles className="h-16 w-16 text-primary animate-pulse mx-auto" />
        </div>
        <h2 className="text-3xl font-bold text-primary mb-2">
          Story submitted!
        </h2>
        <p className="text-lg text-muted-foreground">
          You'll see it go live once it's reviewed.
        </p>
      </div>
    </div>
  );
};

export default SuccessAnimation;