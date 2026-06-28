import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Standard error + retry state for failed data fetches.
 *
 * Use on every data surface (feed, search, story detail, admin lists) so a
 * failed query never falls through to a misleading "empty" / "not found"
 * state. Pass the query's `refetch` to `onRetry`.
 */
export const QueryError = ({
  title = "Something went wrong",
  message = "We couldn't load this right now. Check your connection and try again.",
  onRetry,
  className = "",
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) => (
  <div className={`px-6 py-20 text-center ${className}`} role="alert">
    <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-3" strokeWidth={1.8} />
    <h3 className="text-lg font-semibold mb-1">{title}</h3>
    <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">{message}</p>
    {onRetry && (
      <Button onClick={onRetry} variant="outline" size="sm">
        Try again
      </Button>
    )}
  </div>
);

export default QueryError;
