import { Sparkles } from "lucide-react";

const SuccessAnimation = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary/20 to-primary/20 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center animate-scale-in">
        <div className="text-8xl mb-6 animate-bounce">🧃</div>
        <div className="text-6xl mb-4">
          <Sparkles className="h-16 w-16 text-primary animate-pulse mx-auto" />
        </div>
        <h2 className="text-3xl font-bold text-primary mb-2">
          Story submitted!
        </h2>
        <p className="text-lg text-muted-foreground">
          You'll see it go live once it's reviewed. 🧃
        </p>
      </div>
    </div>
  );
};

export default SuccessAnimation;