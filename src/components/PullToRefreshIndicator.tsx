import { ArrowDown, Loader2 } from "lucide-react";

interface Props {
  pullDistance: number;
  status: "idle" | "pulling" | "armed" | "refreshing";
}

/**
 * Floating indicator that follows the user's pull gesture. Sits below
 * the sticky header and translates down as the user pulls.
 */
const PullToRefreshIndicator = ({ pullDistance, status }: Props) => {
  if (status === "idle" && pullDistance === 0) return null;

  const isRefreshing = status === "refreshing";
  const isArmed = status === "armed";
  const translate = Math.max(0, pullDistance - 24);
  const opacity = Math.min(1, pullDistance / 60);

  return (
    <div
      className="pointer-events-none fixed left-1/2 top-16 z-50 -translate-x-1/2"
      style={{
        transform: `translate(-50%, ${translate}px)`,
        opacity,
        transition: isRefreshing ? "transform 200ms ease" : undefined,
      }}
      aria-hidden
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-soft backdrop-blur ${
          isArmed ? "ring-2 ring-juice-orange" : "ring-1 ring-black/5"
        }`}
      >
        {isRefreshing ? (
          <Loader2 className="h-4 w-4 animate-spin text-juice-orange" />
        ) : (
          <ArrowDown
            className={`h-4 w-4 text-juice-orange transition-transform duration-150 ${
              isArmed ? "rotate-180" : ""
            }`}
          />
        )}
      </div>
    </div>
  );
};

export default PullToRefreshIndicator;