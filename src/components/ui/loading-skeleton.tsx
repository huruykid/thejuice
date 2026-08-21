import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface LoadingSkeletonProps {
  type?: 'profile' | 'verification' | 'general';
  message?: string;
}

const LoadingSkeleton = ({ type = 'general', message }: LoadingSkeletonProps) => {
  const getSkeletonContent = () => {
    switch (type) {
      case 'profile':
        return (
          <>
            <Skeleton className="h-16 w-16 rounded-full mx-auto" />
            <Skeleton className="h-6 w-48 mx-auto" />
            <Skeleton className="h-4 w-32 mx-auto" />
            <div className="space-y-3 mt-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </>
        );
      case 'verification':
        return (
          <>
            <Skeleton className="h-16 w-16 rounded-full mx-auto" />
            <Skeleton className="h-6 w-56 mx-auto" />
            <Skeleton className="h-4 w-40 mx-auto" />
            <div className="space-y-4 mt-6">
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-10 w-full" />
            </div>
          </>
        );
      default:
        return (
          <>
            <Skeleton className="h-16 w-16 rounded-full mx-auto" />
            <Skeleton className="h-6 w-40 mx-auto" />
            <Skeleton className="h-4 w-56 mx-auto" />
            <div className="space-y-3 mt-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center space-y-4">
          {getSkeletonContent()}
        </CardHeader>
        <CardContent>
          {message && (
            <p className="text-center text-muted-foreground text-sm">
              {message}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoadingSkeleton;