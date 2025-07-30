import { Sparkles } from "lucide-react";

const SuccessAnimation = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-juice-blue/20 to-juice-coral/20 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center animate-scale-in">
        <div className="text-8xl mb-6 animate-bounce">🧃</div>
        <div className="text-6xl mb-4">
          <Sparkles className="h-16 w-16 text-juice-coral animate-pulse mx-auto" />
        </div>
        <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
          Story Published!
        </h2>
        <p className="text-lg text-muted-foreground">
          Your tea has been spilled! ☕✨
        </p>
      </div>
    </div>
  );
};

export default SuccessAnimation;