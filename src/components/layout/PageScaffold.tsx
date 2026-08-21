import { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";

/**
 * THE page shell for authenticated mobile pages — one header pattern, one
 * spacing system, safe areas built in (see IPHONE_DESIGN_AUDIT.md).
 *
 * - Sticky h-12 hairline header padded for the Dynamic Island, with a 44pt
 *   back target, a base/semibold title, and a right-side action slot.
 * - Header and content share the same max-width, so they can't drift apart.
 * - Bottom padding clears the fixed tab bar + home indicator (or just the
 *   home indicator when `nav` is off).
 *
 * Home keeps its bespoke wordmark header; every other page belongs on this.
 */
interface PageScaffoldProps {
  title: ReactNode;
  /** Show a back chevron (routes with no tab of their own). */
  back?: boolean;
  /** Right-side header slot (icon button, text action). Keep targets ≥44pt. */
  action?: ReactNode;
  children: ReactNode;
  /** Content + header column width. Feed-like pages use "xl". */
  maxWidth?: "md" | "xl" | "3xl";
  /** Render the bottom tab bar (default true). */
  nav?: boolean;
  onCreateStory?: () => void;
}

const widthClass = { md: "max-w-md", xl: "max-w-xl", "3xl": "max-w-3xl" } as const;

const PageScaffold = ({
  title,
  back = false,
  action,
  children,
  maxWidth = "md",
  nav = true,
  onCreateStory,
}: PageScaffoldProps) => {
  const navigate = useNavigate();
  const width = widthClass[maxWidth];

  return (
    <div
      className={
        nav
          ? "min-h-screen bg-background pb-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:pb-8"
          : "min-h-screen bg-background pb-[calc(2rem+env(safe-area-inset-bottom,0px))]"
      }
    >
      <header className="sticky top-0 z-40 pt-[env(safe-area-inset-top,0px)] bg-background/95 backdrop-blur border-b border-border">
        <div className={`flex h-12 items-center gap-1 px-2 ${width} mx-auto`}>
          {back && (
            <button
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
            </button>
          )}
          <h1 className={`min-w-0 flex-1 truncate text-base font-semibold ${back ? "" : "pl-2"}`}>
            {title}
          </h1>
          {action && <div className="flex shrink-0 items-center pr-1">{action}</div>}
        </div>
      </header>

      <div className={`${width} mx-auto`}>{children}</div>

      {nav && <Navigation onCreateStory={onCreateStory} />}
    </div>
  );
};

export default PageScaffold;
