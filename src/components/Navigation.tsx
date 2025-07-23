import { Home, Plus, Search, User, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";

interface NavigationProps {
  onCreateStory?: () => void;
}

const Navigation = ({ onCreateStory }: NavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-juice-orange/10 z-50">
      <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
        <Button 
          variant="ghost" 
          size="icon" 
          className="flex-col h-auto py-2 rounded-xl"
          onClick={() => navigate('/')}
        >
          <Home className={`h-5 w-5 ${location.pathname === '/' ? 'text-juice-orange' : 'text-muted-foreground'}`} />
          <span className="text-xs text-muted-foreground mt-1">Home</span>
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="flex-col h-auto py-2 rounded-xl"
          onClick={() => navigate('/explore')}
        >
          <Search className={`h-5 w-5 ${location.pathname === '/explore' ? 'text-juice-orange' : 'text-muted-foreground'}`} />
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
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="flex-col h-auto py-2 rounded-xl"
          onClick={() => navigate('/comments')}
        >
          <MessageCircle className={`h-5 w-5 ${location.pathname === '/comments' ? 'text-juice-orange' : 'text-muted-foreground'}`} />
          <span className="text-xs text-muted-foreground mt-1">Comments</span>
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="flex-col h-auto py-2 rounded-xl"
          onClick={() => navigate('/profile')}
        >
          <User className={`h-5 w-5 ${location.pathname === '/profile' ? 'text-juice-orange' : 'text-muted-foreground'}`} />
          <span className="text-xs text-muted-foreground mt-1">Profile</span>
        </Button>
      </div>
    </nav>
  );
};

export default Navigation;