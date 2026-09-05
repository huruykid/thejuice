import { useState, useEffect, useRef } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Lock, Flag, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { track } from "@/lib/analytics";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SubjectPreview {
  subject_name: string;
  review_count: number;
  avg_vibe: number | null;
  is_seed: boolean;
  preview: string | null;
}

/**
 * The search-led "magic moment" for unverified / pending users.
 *
 * Type a name → see whether tea EXISTS, without reading real content:
 *  - seed (fictional) people show a full preview (safe taste),
 *  - real people come back content-free (locked) → "Verify to read",
 *  - no match → "No tea yet" → "Verify to be the first".
 * Reading real content stays gated by RLS; this only ever shows counts + verdicts + a
 * snippet for fictional seed entries (see search_subject_preview).
 */
interface SubjectSearchProps {
  /** Called when an unverified user taps a locked/verify CTA. Omitted for pending users. */
  onStartVerification?: () => void;
  /** Pending users have already submitted — show "unlocks when approved" instead of verify CTAs. */
  pending?: boolean;
}

const SubjectSearch = ({ onStartVerification, pending = false }: SubjectSearchProps) => {
  // Email nudges deep-link here as /app?q=<name> so the prompt continues the moment.
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [debounced, setDebounced] = useState(() => (searchParams.get("q") ?? "").trim());

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  // The bottom-nav search icon deep-links unverified users here as /app#search
  // (see Navigation.tsx), since /explore is gated. Focus + reveal the input so the
  // tap lands on the search box they can actually use.
  useEffect(() => {
    if (location.hash === "#search") {
      inputRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [location.hash]);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["subject-search", debounced],
    staleTime: 60_000,
    queryFn: async (): Promise<SubjectPreview[]> => {
      const { data, error } = await supabase.rpc("search_subject_preview", { q: debounced });
      if (error) throw error;
      return (data ?? []) as SubjectPreview[];
    },
  });

  // Verdicts are stored as +1 (juice/green) / -1 (milk/red), so the average's SIGN is the
  // signal. (The old 5-point-scale thresholds classified everything as red.)
  const verdict = (v: number | null) => {
    if (v == null) return null;
    if (v < 0) return { label: "mostly red flags", icon: <Flag className="h-3.5 w-3.5" style={{ color: "hsl(var(--destructive))" }} /> };
    if (v > 0) return { label: "mostly green flags", icon: <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "hsl(var(--success))" }} /> };
    return { label: "mixed", icon: <Flag className="h-3.5 w-3.5 text-muted-foreground" /> };
  };

  const searching = debounced.length > 0;
  const noResults = searching && !isFetching && results.length === 0;

  // Log a search_miss once per name. Powers the "still no tea on {name}" email nudge —
  // the highest-intent posting prompt in the app. De-duped so keystrokes don't spam.
  const missLoggedRef = useRef<string | null>(null);
  useEffect(() => {
    if (noResults && debounced.length >= 2 && missLoggedRef.current !== debounced) {
      missLoggedRef.current = debounced;
      void track("search_miss", { name: debounced });
    }
  }, [noResults, debounced]);

  return (
    <div className="space-y-3">
      {/* Search hero */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Look someone up…"
          aria-label="Search for a person"
          className="w-full h-12 pl-10 pr-4 rounded-2xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
        />
      </div>

      {/* Miss state */}
      {noResults && (
        <Card className="p-5 text-center bg-card border-border">
          <p className="text-sm font-semibold text-foreground">No tea on "{debounced}" yet.</p>
          {pending ? (
            <p className="text-sm text-muted-foreground mt-1">
              You'll be able to be the first once your account is approved.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mt-1 mb-3">Be the first to share your experience.</p>
              <Button size="sm" onClick={onStartVerification}>Verify to be the first</Button>
            </>
          )}
        </Card>
      )}

      {/* Results / taste feed */}
      {results.map((r) => {
        const v = verdict(r.avg_vibe);
        return (
          <Card key={r.subject_name} className="p-4 bg-card border-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                {r.subject_name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{r.subject_name}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>{r.review_count} review{r.review_count === 1 ? "" : "s"}</span>
                  {v && <><span>·</span>{v.icon}<span>{v.label}</span></>}
                </div>
              </div>
            </div>

            {r.is_seed && r.preview ? (
              <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{r.preview}…</p>
            ) : (
              <div className="mt-3 relative rounded-lg overflow-hidden">
                <div className="space-y-1.5 blur-sm select-none pointer-events-none" aria-hidden>
                  <div className="h-2.5 bg-muted rounded w-full" />
                  <div className="h-2.5 bg-muted rounded w-5/6" />
                </div>
                {pending ? (
                  <span className="absolute inset-0 flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <Lock className="h-3.5 w-3.5" /> Unlocks when you're approved
                  </span>
                ) : (
                  <button
                    onClick={onStartVerification}
                    className="absolute inset-0 flex items-center justify-center gap-1.5 text-xs font-semibold text-primary"
                  >
                    <Lock className="h-3.5 w-3.5" /> Verify to read
                  </button>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default SubjectSearch;
