import { Home, Search, PlusSquare, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

interface NavigationProps {
  onCreateStory?: () => void;
}

const Navigation = ({ onCreateStory }: NavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();

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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-border pb-[env(safe-area-inset-bottom,0px)] lg:hidden">
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
          const active = location.pathname === tab.path;
          return (
            <button
              key={i}
              onClick={() => navigate(tab.path)}
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