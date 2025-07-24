import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Settings, Heart, MessageCircle, LogOut } from "lucide-react";
import Navigation from "@/components/Navigation";
import CreateStory from "@/components/CreateStory";
import InviteManager from "@/components/InviteManager";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const [showCreateStory, setShowCreateStory] = useState(false);
  const { signOut, user } = useAuth();
  const { profile } = useProfile(user);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    }
  };

  // Mock data for now - in real app this would come from Supabase
  const userStats = {
    storiesPosted: 12,
    totalLikes: 84,
    commentsReceived: 23,
    memberSince: "January 2024"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-juice-orange/5 to-juice-pink/5 pb-20">
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-juice-orange to-juice-pink rounded-full mx-auto mb-4 flex items-center justify-center">
            <User className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{profile?.anonymous_username || 'Your Profile'}</h1>
          <p className="text-muted-foreground">Anonymous storyteller</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-juice-orange mb-1">{userStats.storiesPosted}</div>
              <div className="text-sm text-muted-foreground">Stories</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-juice-pink mb-1">{userStats.totalLikes}</div>
              <div className="text-sm text-muted-foreground">Likes</div>
            </CardContent>
          </Card>
        </div>

        {/* Account Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Member since</span>
              <Badge variant="secondary">{userStats.memberSince}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Comments received</span>
              <div className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{userStats.commentsReceived}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invite Management */}
        <InviteManager />

        {/* Quick Actions */}
        <div className="space-y-3">
          <Button 
            onClick={() => setShowCreateStory(true)}
            className="w-full bg-gradient-to-r from-juice-orange to-juice-pink hover:from-juice-orange/90 hover:to-juice-pink/90"
          >
            Share Your Story
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate('/privacy-settings')}
          >
            Privacy Settings
          </Button>
          
          <Button variant="ghost" className="w-full text-muted-foreground">
            Help & Support
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      <Navigation />
      
      {showCreateStory && (
        <CreateStory onClose={() => setShowCreateStory(false)} />
      )}
    </div>
  );
};

export default Profile;