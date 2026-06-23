import { Flag } from "lucide-react";
import { cn } from "@/lib/utils";

export type FlagCategoryKey =
  | "communication"
  | "loyalty"
  | "vibe"
  | "respect";

export interface FlagCategory {
  key: FlagCategoryKey;
  label: string;
  description: string;
}

export const FLAG_CATEGORIES: FlagCategory[] = [
  {
    key: "communication",
    label: "Communication",
    description: "How responsive and clear were they?",
  },
  {
    key: "loyalty",
    label: "Honesty",
    description: "Did they keep their word?",
  },
  {
    key: "vibe",
    label: "Vibe",
    description: "Overall energy of the connection",
  },
  {
    key: "respect",
    label: "Respect",
    description: "Did they treat you well?",
  },
];

/**
 * Flag rating value:
 *   -3..-1 = red flags (count = abs value)
 *    1..3  = green flags
 *    0     = not rated
 */
export type FlagValue = -3 | -2 | -1 | 0 | 1 | 2 | 3;

interface FlagRatingInputProps {
  value: FlagValue;
  onChange: (next: FlagValue) => void;
  category: FlagCategory;
}

export const FlagRatingInput = ({
  value,
  onChange,
  category,
}: FlagRatingInputProps) => {
  const color: "green" | "red" | "none" =
    value > 0 ? "green" : value < 0 ? "red" : "none";
  const count = Math.abs(value);

  const pick = (next: "green" | "red") => {
    // Toggling same color/same count back to 0
    if (next === color && count === 1) {
      onChange(0);
      return;
    }
    // First tap on a color sets count 1
    if (next !== color) {
      onChange((next === "green" ? 1 : -1) as FlagValue);
      return;
    }
    // Same color — cycle count 1 -> 2 -> 3 -> 1
    const nextCount = (count % 3) + 1;
    onChange(((next === "green" ? 1 : -1) * nextCount) as FlagValue);
  };

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{category.label}</p>
          <p className="text-xs text-muted-foreground">{category.description}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => pick("green")}
            aria-label={`${category.label}: green flag`}
            className={cn(
              "h-9 px-2.5 rounded-full border flex items-center gap-1 transition-all active:scale-95",
              color === "green"
                ? "bg-juice-green/15 border-juice-green text-juice-green"
                : "bg-background border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <Flag
              className="h-4 w-4"
              fill={color === "green" ? "currentColor" : "none"}
              strokeWidth={2}
            />
            {color === "green" && (
              <span className="text-xs font-semibold">×{count}</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => pick("red")}
            aria-label={`${category.label}: red flag`}
            className={cn(
              "h-9 px-2.5 rounded-full border flex items-center gap-1 transition-all active:scale-95",
              color === "red"
                ? "bg-primary/15 border-primary text-primary"
                : "bg-background border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <Flag
              className="h-4 w-4"
              fill={color === "red" ? "currentColor" : "none"}
              strokeWidth={2}
            />
            {color === "red" && (
              <span className="text-xs font-semibold">×{count}</span>
            )}
          </button>
        </div>
      </div>
      <p className="mt-1.5 text-[11px] text-muted-foreground">
        Tap once to choose. Tap again to add intensity (up to 3). Tap a third time to clear.
      </p>
    </div>
  );
};

interface FlagRatingDisplayProps {
  ratings: {
    communication: number;
    loyalty: number;
    vibe: number;
    respect: number;
  };
}

/**
 * Compact flag-chip row for story cards. Hides any category with value 0.
 * Accepts legacy 1-5 values too (treated as green flags clamped to 3).
 */
export const FlagRatingDisplay = ({ ratings }: FlagRatingDisplayProps) => {
  const items = FLAG_CATEGORIES.map((c) => {
    const raw = ratings[c.key] ?? 0;
    // Legacy 1-5 → treat 1-2 as none, 3 as 1 green, 4 as 2, 5 as 3
    let v: number = raw;
    if (raw > 3) v = Math.min(3, raw - 2);
    return { ...c, value: v };
  }).filter((i) => i.value !== 0);

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 px-4 pt-2">
      {items.map((i) => {
        const isGreen = i.value > 0;
        const count = Math.abs(i.value);
        return (
          <span
            key={i.key}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
              isGreen
                ? "bg-juice-green/10 border-juice-green/30 text-juice-green"
                : "bg-primary/10 border-primary/30 text-primary"
            )}
          >
            <Flag className="h-2.5 w-2.5" fill="currentColor" strokeWidth={2} />
            {i.label}
            <span className="opacity-70">×{count}</span>
          </span>
        );
      })}
    </div>
  );
};