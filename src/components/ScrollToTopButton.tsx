import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/**
 * Floating up-arrow that appears once the user scrolls past one viewport.
 * Positioned above the mobile bottom nav, lower on desktop.
 */
const ScrollToTopButton = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Scroll to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed right-4 bottom-20 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-1 ring-border transition-all duration-200 lg:bottom-8 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
      }`}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
};

export default ScrollToTopButton;