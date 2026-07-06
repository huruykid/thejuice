import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import BrandLockup from "@/components/BrandLockup";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <Link to="/" aria-label="Juice home" className="inline-block mb-8">
          <BrandLockup variant="stacked" size="md" />
        </Link>
        <h1 className="font-display font-extrabold uppercase tracking-tight text-6xl text-foreground mb-2">
          404
        </h1>
        <p className="text-muted-foreground mb-8">
          No tea here — this page doesn't exist or has been removed.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="juice" className="font-bold">
            <Link to="/app">
              Look someone up
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/">Back to home</Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-6">
          New here?{" "}
          <Link to="/how-it-works" className="text-primary font-semibold hover:underline">
            See how Juice works
          </Link>
        </p>
      </div>
    </div>
  );
};

export default NotFound;
