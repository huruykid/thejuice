import { ReactNode } from "react";
import { useLocation, Link } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const TITLES: Record<string, string> = {
  "/admin": "Overview",
  "/admin/verifications": "Verifications",
  "/admin/posts": "Posts",
  "/admin/reports": "Reports",
};

export const AdminLayout = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const current = TITLES[pathname] ?? "Admin";
  const isRoot = pathname === "/admin";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-10 h-14 flex items-center gap-3 border-b border-border bg-background/95 backdrop-blur px-4">
            <SidebarTrigger />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  {isRoot ? (
                    <BreadcrumbPage>Admin</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link to="/admin">Admin</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isRoot && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{current}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;