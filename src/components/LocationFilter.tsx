import { MapPin, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { DISTANCE_RANGES, formatDistance } from "@/lib/distance";
import type { GeolocationCoordinates } from "@/hooks/useGeolocation";

interface LocationFilterProps {
  userLocation: GeolocationCoordinates | null;
  selectedRadius: number | null;
  onRadiusChange: (radius: number | null) => void;
  nearbyCount?: number;
  onClearLocation: () => void;
}

export const LocationFilter = ({
  userLocation,
  selectedRadius,
  onRadiusChange,
  nearbyCount = 0,
  onClearLocation,
}: LocationFilterProps) => {
  if (!userLocation) return null;

  return (
    <Card className="modern-card p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            Location-based Stories
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearLocation}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Clear
        </Button>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <Filter className="h-3 w-3 text-muted-foreground" />
          <Select 
            value={selectedRadius?.toString() || "all"} 
            onValueChange={(value) => 
              onRadiusChange(value === "all" ? null : Number(value))
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DISTANCE_RANGES.map((range) => (
                <SelectItem 
                  key={range.value || "all"} 
                  value={range.value?.toString() || "all"}
                >
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {selectedRadius && (
          <span className="text-xs text-muted-foreground">
            {nearbyCount} {nearbyCount === 1 ? 'story' : 'stories'}
          </span>
        )}
      </div>
    </Card>
  );
};