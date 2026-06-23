import { NavLink } from "react-router-dom";
import { ShieldCheck, FileText, Flag, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminPendingCounts } from "@/hooks/useAdminPendingCounts";

type Item = {
  to: string;
  label: string;
  icon: typeof ShieldCheck;
  countKey?: "verifications" | "posts" | "reports";
};

const items: Item[] = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/verifications", label: "Verifications", icon: ShieldCheck, countKey: "verifications" },
  { to: "/admin/posts", label: "Posts", icon: FileText, countKey: "posts" },
  { to: "/admin/reports", label: "Reports", icon: Flag, countKey: "reports" },
];

export const AdminNav = () => {
  const { data: counts } = useAdminPendingCounts(true);

  return (
    <nav
      aria-label="Admin sections"
      className="mb-4 flex items-center gap-1 rounded-lg border border-border bg-card p-1 overflow-x-auto"
    >
      {items.map(({ to, label, icon: Icon, countKey }) => {
        const count = countKey && counts ? counts[countKey] : 0;
        return (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
            {count > 0 && (
              <span className="ml-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-semibold text-destructive-foreground">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
};

export default AdminNav;