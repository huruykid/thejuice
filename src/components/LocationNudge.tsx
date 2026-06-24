import { useState } from "react";
import { MapPin, X } from "lucide-react";

const DISMISSED_KEY = "juice_location_nudge_dismissed";

interface Props {
  onEnable: () => void;
}

/**
 * One-time subtle bar prompting the user to share their location.
 * Only shown when geolocation permission is "prompt" (never asked before).
 * Dismissed state persists in localStorage — never shown again after dismissal.
 */
const LocationNudge = ({ onEnable }: Props) => {
  const [visible, setVisible] = useState(
    () => !localStorage.getItem(DISMISSED_KEY)
  );

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  };

  const handleEnable = () => {
    onEnable();
    dismiss();
  };

  if (!visible) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-muted border-b border-border">
      <MapPin className="h-4 w-4 text-primary shrink-0" strokeWidth={1.8} />
      <button
        onClick={handleEnable}
        className="flex-1 text-left text-sm text-foreground hover:text-primary transition-colors"
      >
        See stories closest to you first
      </button>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="p-1 -mr-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default LocationNudge;
