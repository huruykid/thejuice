import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck, FileText, Flag, LayoutDashboard, Scale, Newspaper, Users, Sparkles, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAdminPendingCounts } from "@/hooks/useAdminPendingCounts";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

type CountKey = "verifications" | "posts" | "reports" | "disputes";
const items: Array<{ to: string; label: string; icon: typeof LayoutDashboard; countKey?: CountKey }> = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/members", label: "Members", icon: Users },
  { to: "/admin/verifications", label: "Verifications", icon: ShieldCheck, countKey: "verifications" },
  { to: "/admin/posts", label: "Posts", icon: FileText, countKey: "posts" },
  { to: "/admin/blog", label: "Blog", icon: Newspaper },
  { to: "/admin/seed", label: "Seed", icon: Sparkles },
  { to: "/admin/reports", label: "Reports", icon: Flag, countKey: "reports" },
  { to: "/admin/disputes", label: "Disputes", icon: Scale, countKey: "disputes" },
];

export const AdminSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { data: counts } = useAdminPendingCounts(true);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (path: string) =>
    path === "/admin" ? pathname === "/admin" : pathname.startsWith(path);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-primary" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <p className="text-sm font-semibold">Admin</p>
              <p className="text-[11px] text-muted-foreground">Moderation console</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspaces</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map(({ to, label, icon: Icon, countKey }) => {
                const count = countKey && counts ? counts[countKey] : 0;
                const active = isActive(to);
                return (
                  <SidebarMenuItem key={to}>
                    <SidebarMenuButton asChild isActive={active} tooltip={label}>
                      <NavLink to={to} end={to === "/admin"} className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {!collapsed && <span className="flex-1">{label}</span>}
                        {!collapsed && count > 0 && (
                          <span
                            className={cn(
                              "ml-auto inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold",
                              active
                                ? "bg-primary-foreground text-primary"
                                : "bg-destructive text-destructive-foreground",
                            )}
                          >
                            {count > 99 ? "99+" : count}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} tooltip="Sign out">
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Sign out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;