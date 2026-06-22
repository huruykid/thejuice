/**
 * Shimmer placeholder matching the StoryCard shape. Used during initial
 * load and while paginating the infinite feed.
 */
const StoryCardSkeleton = () => {
  return (
    <div className="mb-4 overflow-hidden rounded-3xl border border-juice-orange/10 bg-white shadow-soft">
      <div className="flex items-center gap-3 border-b border-juice-orange/10 p-4">
        <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
        <div className="ml-auto h-3 w-10 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-48 w-full animate-pulse bg-muted" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
        <div className="flex gap-2 pt-2">
          <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-juice-orange/10 px-4 py-3">
        <div className="h-7 w-16 animate-pulse rounded bg-muted" />
        <div className="flex gap-2">
          <div className="h-7 w-16 animate-pulse rounded-full bg-muted" />
          <div className="h-7 w-16 animate-pulse rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
};

export default StoryCardSkeleton;