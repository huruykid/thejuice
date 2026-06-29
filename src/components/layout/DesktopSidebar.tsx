import { Home, Search, Bell, User, Plus, Shield, LogOut, ClipboardList, UserCheck, Flag } from "lucide-react";
import BrandLockup from "@/components/BrandLockup";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

interface DesktopSidebarProps {
  onCreateStory?: () => void;
}

const navItems = [
  { title: "Home", url: "/app", icon: Home },
  { title: "Explore", url: "/explore", icon: Search },
  { title: "Activity", url: "/activity", icon: Bell },
  { title: "Profile", url: "/profile", icon: User },
];

const DesktopSidebar = ({ onCreateStory }: DesktopSidebarProps) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useUserRole(user?.id);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 xl:w-72 shrink-0 border-r border-primary/10 bg-background/60 backdrop-blur-xl sticky top-0 h-screen">
      <div className="flex items-center gap-3 px-6 py-6 border-b border-primary/10">
        <BrandLockup variant="inline" size="sm" />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.url;
          return (
            <NavLink
              key={item.url}
              to={item.url}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-foreground/80 hover:bg-muted/60"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-base">{item.title}</span>
            </NavLink>
          );
        })}

        {isAdmin && (
          <div className="pt-4 mt-2 border-t border-primary/10">
            <div className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Moderation
            </div>
            <NavLink
              to="/admin/posts"
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors ${
                pathname === "/admin/posts"
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-foreground/80 hover:bg-muted/60"
              }`}
            >
              <ClipboardList className="h-5 w-5" />
              <span className="text-sm">Pending posts</span>
            </NavLink>
            <NavLink
              to="/admin/verifications"
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors ${
                pathname === "/admin/verifications"
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-foreground/80 hover:bg-muted/60"
              }`}
            >
              <UserCheck className="h-5 w-5" />
              <span className="text-sm">Verifications</span>
            </NavLink>
            <NavLink
              to="/admin/reports"
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors ${
                pathname === "/admin/reports"
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-foreground/80 hover:bg-muted/60"
              }`}
            >
              <Flag className="h-5 w-5" />
              <span className="text-sm">Reports</span>
            </NavLink>
          </div>
        )}

        {onCreateStory && (
          <div className="pt-4">
            <Button
              variant="juice"
              className="w-full rounded-xl h-12 shadow-glow"
              onClick={onCreateStory}
            >
              <Plus className="h-5 w-5 mr-2" />
              Share the Juice
            </Button>
          </div>
        )}
      </nav>

      <div className="px-3 py-4 border-t border-primary/10 space-y-1">
        <NavLink
          to="/privacy-settings"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
        >
          <Shield className="h-4 w-4" />
          Privacy
        </NavLink>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
};

export default DesktopSidebar;