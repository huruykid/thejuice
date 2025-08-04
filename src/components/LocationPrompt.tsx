import { MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface LocationPromptProps {
  onRequestLocation: () => void;
  onDismiss: () => void;
  isLoading?: boolean;
}

export const LocationPrompt = ({ 
  onRequestLocation, 
  onDismiss, 
  isLoading = false 
}: LocationPromptProps) => {
  return (
    <Card className="modern-card p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center">
            <MapPin className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">
              See Stories Near You
            </h3>
            <p className="text-sm text-muted-foreground">
              Find dating stories from your area
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        Allow location access to discover stories from people in your city and nearby areas.
      </p>
      
      <div className="flex gap-3">
        <Button
          onClick={onRequestLocation}
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? (
            <>
              <div className="animate-pulse">Getting location...</div>
            </>
          ) : (
            <>
              <MapPin className="h-4 w-4 mr-2" />
              Enable Location
            </>
          )}
        </Button>
        <Button variant="outline" onClick={onDismiss}>
          Not Now
        </Button>
      </div>
    </Card>
  );
};