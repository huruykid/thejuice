import { NavLink } from "react-router-dom";
import { ShieldCheck, FileText, Flag } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/admin/verifications", label: "Verifications", icon: ShieldCheck },
  { to: "/admin/posts", label: "Posts", icon: FileText },
  { to: "/admin/reports", label: "Reports", icon: Flag },
];

export const AdminNav = () => (
  <nav
    aria-label="Admin sections"
    className="mb-4 flex items-center gap-1 rounded-lg border border-border bg-card p-1 overflow-x-auto"
  >
    {items.map(({ to, label, icon: Icon }) => (
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
      </NavLink>
    ))}
  </nav>
);

export default AdminNav;