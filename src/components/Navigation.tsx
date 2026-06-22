import { Home, Plus, Search, User, Bell } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

interface NavigationProps {
  onCreateStory?: () => void;
}

const Navigation = ({ onCreateStory }: NavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { icon: Home, label: "Home", path: "/app" },
    { icon: Search, label: "Explore", path: "/explore" },
    { icon: null, label: "Spill", action: "create" as const },
    { icon: Bell, label: "Activity", path: "/activity" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t-4 border-foreground lg:hidden">
      <div className="grid grid-cols-5 h-16 max-w-md mx-auto">
        {tabs.map((tab, i) => {
          if (tab.action === "create") {
            return (
              <button
                key={i}
                onClick={onCreateStory}
                aria-label="Spill the tea"
                className="flex flex-col items-center justify-center group"
              >
                <div className="-mt-7 w-12 h-12 bg-primary border-2 border-foreground shadow-brut-sm flex items-center justify-center active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all">
                  <Plus className="h-6 w-6 text-primary-foreground" strokeWidth={3} />
                </div>
                <span className="font-display text-[11px] uppercase tracking-tighter mt-0.5">
                  Spill
                </span>
              </button>
            );
          }
          const Icon = tab.icon!;
          const active = location.pathname === tab.path;
          return (
            <button
              key={i}
              onClick={() => navigate(tab.path!)}
              className={`flex flex-col items-center justify-center gap-0.5 border-l-2 border-foreground first:border-l-0 transition-colors ${
                active ? "bg-accent" : "bg-background hover:bg-accent/40"
              }`}
            >
              <Icon className="h-5 w-5 text-foreground" strokeWidth={active ? 2.5 : 2} />
              <span className="font-display text-[11px] uppercase tracking-tighter text-foreground">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;