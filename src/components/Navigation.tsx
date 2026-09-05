import { Home, Search, PlusSquare, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useVerification } from "@/hooks/useVerification";

interface NavigationProps {
  onCreateStory?: () => void;
}

const Navigation = ({ onCreateStory }: NavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isVerified, isLoading: verificationLoading } = useVerification(user?.id);

  // The Explore tab (search icon) points at /explore, which VerifiedRoute bounces
  // straight back to /app for anyone unverified — making the tap a no-op from the
  // user's seat. For those users, send the search icon to the home search box they
  // CAN use (SubjectSearch) instead. Only override once verification is known, so a
  // verified user isn't briefly routed to /app during the status fetch.
  const unverified = !!user && !verificationLoading && !isVerified;

  type Tab =
    | { kind: "nav"; icon: typeof Home; label: string; path: string }
    | { kind: "create"; label: string };

  const tabs: Tab[] = [
    { kind: "nav", icon: Home, label: "Home", path: "/app" },
    { kind: "nav", icon: Search, label: "Explore", path: "/explore" },
    { kind: "create", label: "Create" },
    { kind: "nav", icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-border lg:hidden">
      <div className="grid grid-cols-4 h-12 max-w-md mx-auto">
        {tabs.map((tab, i) => {
          if (tab.kind === "create") {
            return (
              <button
                key={i}
                onClick={onCreateStory}
                aria-label="Create story"
                className="flex items-center justify-center group"
              >
                <PlusSquare className="h-7 w-7 text-foreground" strokeWidth={1.8} />
              </button>
            );
          }
          const Icon = tab.icon;
          // Unverified users can't reach /explore; the search tab instead focuses
          // the home search box via the #search hash (SubjectSearch handles it).
          const isSearchTab = tab.path === "/explore";
          const to = isSearchTab && unverified ? "/app#search" : tab.path;
          const active = location.pathname === tab.path;
          return (
            <button
              key={i}
              onClick={() => navigate(to)}
              aria-label={tab.label}
              className="relative flex items-center justify-center transition-colors"
            >
              <Icon
                className="h-6 w-6 text-foreground"
                strokeWidth={active ? 2.4 : 1.8}
                fill={active ? "currentColor" : "none"}
              />
              {active && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;