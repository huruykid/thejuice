import { ReactNode } from "react";
import DesktopSidebar from "./DesktopSidebar";
import DesktopRightRail from "./DesktopRightRail";

interface AppShellProps {
  children: ReactNode;
  onCreateStory?: () => void;
  showRightRail?: boolean;
}

/**
 * App shell that gives authenticated routes a true desktop layout
 * (sidebar + main column + optional right rail) on lg+ screens,
 * while leaving the mobile layout completely untouched.
 */
const AppShell = ({ children, onCreateStory, showRightRail = true }: AppShellProps) => {
  return (
    <div className="lg:flex lg:min-h-screen lg:bg-background">
      <DesktopSidebar onCreateStory={onCreateStory} />
      <main className="flex-1 min-w-0">{children}</main>
      {showRightRail && <DesktopRightRail />}
    </div>
  );
};

export default AppShell;