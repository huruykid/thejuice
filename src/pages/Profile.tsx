import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LogOut, MapPin, Settings, Share2, Grid3X3, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import CreateStory from "@/components/CreateStory";
import StoryCard from "@/components/StoryCard";
import LoadingSkeleton from "@/components/ui/loading-skeleton";
import ThemeToggle from "@/components/ThemeToggle";
import CitySheet from "@/components/CitySheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useVerification } from "@/hooks/useVerification";
import { useUserStats } from "@/hooks/useUserStats";
import { useToast } from "@/hooks/use-toast";
import { useStoriesByProfile } from "@/hooks/useStories";
import { useBookmarkedStories } from "@/hooks/useBookmarks";
import { getStoryAuthorName } from "@/lib/storyAuthor";
import ViewAsMenu from "@/components/ViewAsMenu";

type ProfileTab = "stories" | "saved";

const Profile = () => {
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>("stories");
  const { signOut, user } = useAuth();
  const { profile } = useProfile(user);
  const { isVerified } = useVerification(user?.id);
  const { userStats, isLoading: statsLoading } = useUserStats();
  const { toast } = useToast();
  const navigate = useNavigate();

  const profileId = (profile as any)?.id as string | undefined;
  const { data: myStories = [] } = useStoriesByProfile(profileId ?? "");
  const { data: savedStories = [], isLoading: savedLoading } = useBookmarkedStories(user?.id);

  const cityId = (profile as any)?.city_id as string | null | undefined;
  const { data: city } = useQuery({
    queryKey: ["city", cityId],
    enabled: !!cityId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cities")
        .select("city_name, state_province")
        .eq("id", cityId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast({ title: "Error", description: "Failed to sign out.", variant: "destructive" });
    } else {
      toast({ title: "Signed out", description: "You've been signed out." });
    }
  };

  if (statsLoading) {
    return (
      <div className="min-h-screen bg-background pb-[calc(5rem+env(safe-area-inset-bottom,0px))]">
        <div className="container mx-auto px-4 py-6 max-w-md lg:max-w-2xl">
          <LoadingSkeleton type="profile" message="Loading your profile..." />
        </div>
        <Navigation />
      </div>
    );
  }

  const username = profile?.anonymous_username || "your_profile";

  return (
    <div className="min-h-screen bg-background pb-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:pb-8">
      {/* IG-style sticky header */}
      <header className="sticky top-0 z-40 pt-[env(safe-area-inset-top,0px)] bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between px-4 h-12 max-w-md mx-auto">
          <h1 className="text-base font-semibold truncate">@{username}</h1>
          <button
            onClick={() => navigate('/privacy-settings')}
            aria-label="Settings"
            className="p-1 -mr-1 text-foreground hover:text-primary transition-colors"
          >
            <Settings className="h-5 w-5" strokeWidth={1.8} />
          </button>
        </div>
      </header>

      <div className="max-w-md lg:max-w-2xl mx-auto px-4 py-5">
        {/* IG profile header: avatar + stats row */}
        <div className="flex items-center gap-6 mb-5">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-primary-foreground text-2xl font-semibold flex-shrink-0">
            {username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 grid grid-cols-3 text-center">
            <div>
              <div className="text-lg font-semibold">{userStats.storiesPosted}</div>
              <div className="text-xs text-muted-foreground">stories</div>
            </div>
            <div>
              <div className="text-lg font-semibold">{userStats.totalLikes}</div>
              <div className="text-xs text-muted-foreground">flags</div>
            </div>
            <div>
              <div className="text-lg font-semibold">{userStats.commentsReceived}</div>
              <div className="text-xs text-muted-foreground">comments</div>
            </div>
          </div>
        </div>

        {/* Bio line */}
        <div className="mb-4 text-sm">
          <p className="font-semibold">@{username}</p>
          <p className="text-muted-foreground">Anonymous storyteller · Member since {userStats.memberSince}</p>
          <button
            onClick={() => setCityOpen(true)}
            className="inline-flex items-center gap-1 mt-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <MapPin className="h-3 w-3" />
            {city ? `${city.city_name}${city.state_province ? ', ' + city.state_province : ''}` : "Set your city"}
          </button>
        </div>

        {/* Action buttons row */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          <Button
            variant="secondary"
            className="h-9 text-sm font-semibold"
            onClick={() => setShowCreateStory(true)}
          >
            Share the Juice
          </Button>
          <Button
            variant="secondary"
            className="h-9 text-sm font-semibold"
            onClick={() => navigate('/privacy-settings')}
          >
            Edit profile
          </Button>
        </div>

        {/* Admin-only, and the mobile home for "Preview as" — the desktop sidebar
            has its own copy, but there is no admin menu on small screens. Renders
            nothing for everyone else, and nothing while a preview is running. */}
        <ViewAsMenu className="mb-5 rounded-lg border border-border p-3" />

        {/* IG-style tab bar */}
        <div className="border-t border-border -mx-4 mb-0">
          <div className="grid grid-cols-2">
            <button
              onClick={() => setActiveTab("stories")}
              className={`flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === "stories"
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Grid3X3 className="h-4 w-4" />
              Stories
            </button>
            <button
              onClick={() => setActiveTab("saved")}
              className={`flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === "saved"
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Bookmark className="h-4 w-4" />
              Saved
            </button>
          </div>
        </div>

        {/* Tab content */}
        {activeTab === "stories" && (
          <div className="-mx-4">
            {myStories.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                No stories yet.{" "}
                <button onClick={() => setShowCreateStory(true)} className="text-primary underline underline-offset-2">
                  Share your first one.
                </button>
              </div>
            ) : (
              myStories.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  authorName={username}
                  subjectName={story.subject_name ?? undefined}
                  user_id={user?.id}
                />
              ))
            )}
          </div>
        )}

        {activeTab === "saved" && (
          <div className="-mx-4">
            {savedLoading ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">Loading…</div>
            ) : savedStories.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                Tap the bookmark icon on any story to save it here.
              </div>
            ) : (
              savedStories.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  authorName={getStoryAuthorName(story as any, "anonymous")}
                  subjectName={story.subject_name ?? undefined}
                  user_id={user?.id}
                />
              ))
            )}
          </div>
        )}

        {/* Appearance */}
        <div className="mb-5 mt-6">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Appearance</p>
          <ThemeToggle />
        </div>

        {/* Quick links */}
        <div className="divide-y divide-border border-t border-b border-border">
          <button
            onClick={() => navigate('/privacy-settings')}
            className="w-full flex items-center justify-between px-1 py-3 text-sm hover:text-primary transition-colors"
          >
            <span>Privacy settings</span>
            <span className="text-muted-foreground">›</span>
          </button>
          <button
            onClick={() => window.open('mailto:support@sipjuice.app?subject=Help%20%26%20Support', '_blank')}
            className="w-full flex items-center justify-between px-1 py-3 text-sm hover:text-primary transition-colors"
          >
            <span>Help & support</span>
            <span className="text-muted-foreground">›</span>
          </button>
          <button
            onClick={() => {
              navigator.share?.({ title: 'The Juice', url: 'https://sipjuice.app' });
            }}
            className="w-full flex items-center justify-between px-1 py-3 text-sm hover:text-primary transition-colors"
          >
            <span className="flex items-center gap-2">
              <Share2 className="h-4 w-4" /> Invite a friend
            </span>
            <span className="text-muted-foreground">›</span>
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="w-full mt-5 flex items-center justify-center gap-2 py-3 text-sm font-medium text-destructive hover:text-destructive/80 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>

      <Navigation onCreateStory={() => setShowCreateStory(true)} />
      <CitySheet open={cityOpen} onClose={() => setCityOpen(false)} currentCityId={cityId} />
      {showCreateStory && <CreateStory onClose={() => setShowCreateStory(false)} isUnverified={!isVerified} />}
    </div>
  );
};

export default Profile;