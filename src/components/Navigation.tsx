import { Home, Plus, Search, User, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavigationProps {
  onCreateStory?: () => void;
}

const Navigation = ({ onCreateStory }: NavigationProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-juice-blue/10 z-50">
      <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
        <Button variant="ghost" size="icon" className="flex-col h-auto py-2 rounded-xl">
          <Home className="h-5 w-5 text-juice-blue" />
          <span className="text-xs text-muted-foreground mt-1">Home</span>
        </Button>
        
        <Button variant="ghost" size="icon" className="flex-col h-auto py-2 rounded-xl">
          <Search className="h-5 w-5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground mt-1">Explore</span>
        </Button>
        
        <Button 
          variant="juice" 
          size="icon" 
          className="rounded-full h-12 w-12 shadow-glow"
          onClick={onCreateStory}
        >
          <Plus className="h-6 w-6" />
        </Button>
        
        <Button variant="ghost" size="icon" className="flex-col h-auto py-2 rounded-xl">
          <MessageCircle className="h-5 w-5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground mt-1">Comments</span>
        </Button>
        
        <Button variant="ghost" size="icon" className="flex-col h-auto py-2 rounded-xl">
          <User className="h-5 w-5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground mt-1">Profile</span>
        </Button>
      </div>
    </nav>
  );
};

export default Navigation;