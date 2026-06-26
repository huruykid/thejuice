import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Lock, Flag, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
const SubjectSearch = ({ onStartVerification }: { onStartVerification: () => void }) => {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["subject-search", debounced],
    staleTime: 60_000,
    queryFn: async (): Promise<SubjectPreview[]> => {
      const { data, error } = await (supabase.rpc as any)("search_subject_preview", { q: debounced });
      if (error) throw error;
      return (data ?? []) as SubjectPreview[];
    },
  });

  const verdict = (v: number | null) => {
    if (v == null) return null;
    if (v <= 2.5) return { label: "mostly red flags", icon: <Flag className="h-3.5 w-3.5" style={{ color: "hsl(var(--destructive))" }} /> };
    if (v >= 3.5) return { label: "mostly green flags", icon: <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "hsl(var(--success))" }} /> };
    return { label: "mixed", icon: <Flag className="h-3.5 w-3.5 text-muted-foreground" /> };
  };

  const searching = debounced.length > 0;
  const noResults = searching && !isFetching && results.length === 0;

  return (
    <div className="space-y-3">
      {/* Search hero */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
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
          <p className="text-sm text-muted-foreground mt-1 mb-3">Be the first to share your experience.</p>
          <Button size="sm" onClick={onStartVerification}>Verify to be the first</Button>
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
                <button
                  onClick={onStartVerification}
                  className="absolute inset-0 flex items-center justify-center gap-1.5 text-xs font-semibold text-primary"
                >
                  <Lock className="h-3.5 w-3.5" /> Verify to read
                </button>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default SubjectSearch;
