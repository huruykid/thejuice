/**
 * Shimmer placeholder matching the StoryCard shape. Used during initial
 * load and while paginating the infinite feed.
 */
const StoryCardSkeleton = () => {
  return (
    <div className="mb-2 bg-background border-b border-border">
      <div className="flex items-center gap-3 px-4 py-2.5">
        <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
        <div className="space-y-1.5">
          <div className="h-2.5 w-24 animate-pulse rounded bg-muted" />
          <div className="h-2 w-16 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="aspect-square w-full animate-pulse bg-muted" />
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="h-6 w-6 animate-pulse rounded-full bg-muted" />
        <div className="h-6 w-6 animate-pulse rounded-full bg-muted" />
        <div className="h-6 w-6 animate-pulse rounded-full bg-muted" />
      </div>
      <div className="space-y-2 px-4 pb-3">
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
};

export default StoryCardSkeleton;