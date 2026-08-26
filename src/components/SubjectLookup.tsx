import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, X, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import StoryCard from "@/components/StoryCard";
import { JuiceIcon, MilkIcon } from "@/components/icons/BrandVoteIcons";
import { useSubjectLookup, type SubjectGroup } from "@/hooks/useSubjectLookup";
import { useDebounce } from "@/hooks/useDebounce";
import { track } from "@/lib/analytics";
import { getStoryAuthorName } from "@/lib/storyAuthor";

/**
 * The verified-member magic moment: look her up by name, right on Home.
 *
 * Results are grouped per subject — name, review count, and the room's verdict — with her
 * stories expandable inline. A miss invites the user to be the first to post (and logs
 * search_miss, same as the unverified SubjectSearch, to power the email nudge).
 */
interface SubjectLookupProps {
  user_id?: string;
  /** Opens the composer; a miss passes the searched name so it lands prefilled. */
  onCreateStory?: (subjectName?: string) => void;
  /** Fires with true while a search is active so the parent can hide the feed. */
  onActiveChange?: (active: boolean) => void;
}

const roomVerdict = (g: SubjectGroup) => {
  if (g.green === 0 && g.red === 0) return null;
  if (g.green > g.red)
    return { icon: <JuiceIcon className="h-4 w-4 shrink-0" />, label: "mostly green flags" };
  if (g.red > g.green)
    return { icon: <MilkIcon className="h-4 w-4 shrink-0" />, label: "mostly red flags" };
  return { icon: <MilkIcon className="h-4 w-4 shrink-0" />, label: "mixed" };
};

const SubjectLookup = ({ user_id, onCreateStory, onActiveChange }: SubjectLookupProps) => {
  // Deep-linkable: /app?q=<name> pre-fills the lookup (subject-name taps on
  // story cards land here). Synced on param change so it works while mounted.
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const appliedParamRef = useRef(searchParams.get("q") ?? "");
  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    if (q && q !== appliedParamRef.current) {
      appliedParamRef.current = q;
      setQuery(q);
    }
  }, [searchParams]);
  const debounced = useDebounce(query, 250);
  const active = debounced.trim().length >= 2;

  const { data: groups = [], isFetching } = useSubjectLookup(active ? debounced : "");

  useEffect(() => {
    onActiveChange?.(active);
    if (!active) setExpandedKey(null);
  }, [active, onActiveChange]);

  // Log search_hit / search_miss once per name — the miss is the highest-intent
  // posting prompt in the app; the pair gives the miss rate as content grows.
  const loggedRef = useRef<string | null>(null);
  const isMiss = active && !isFetching && groups.length === 0;
  const isHit = active && !isFetching && groups.length > 0;
  useEffect(() => {
    if (!active || loggedRef.current === debounced) return;
    if (isMiss) {
      loggedRef.current = debounced;
      void track("search_miss", { name: debounced });
    } else if (isHit) {
      loggedRef.current = debounced;
      void track("search_hit", { name: debounced, results: groups.length });
    }
  }, [active, isMiss, isHit, debounced, groups.length]);

  return (
    <div className="px-4 pt-3 pb-1">
      {/* Search hero */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Look her up — search a name"
          aria-label="Look her up — search a name"
          className="pl-9 pr-9 h-11 bg-muted border-0 text-sm rounded-lg focus-visible:ring-1 focus-visible:ring-primary/40"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-1 top-1/2 -translate-y-1/2 min-h-9 min-w-9 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Results */}
      {active && (
        <div className="pt-2">
          {isFetching && groups.length === 0 ? (
            <div className="space-y-2 py-2" aria-hidden>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : groups.length > 0 ? (
            <div className="divide-y divide-border">
              {groups.map((g) => {
                const verdict = roomVerdict(g);
                const expanded = expandedKey === g.key;
                return (
                  <div key={g.key}>
                    <button
                      onClick={() => setExpandedKey(expanded ? null : g.key)}
                      aria-expanded={expanded}
                      className="w-full min-h-14 py-2.5 flex items-center gap-3 text-left hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-primary-foreground text-sm font-semibold flex-shrink-0">
                        {g.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1 leading-tight">
                        <p className="text-sm font-semibold text-foreground truncate">{g.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          {g.count} {g.count === 1 ? "review" : "reviews"}
                          {verdict && (
                            <>
                              <span aria-hidden>·</span>
                              {verdict.icon}
                              {verdict.label}
                            </>
                          )}
                        </p>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
                        aria-hidden
                      />
                    </button>
                    {expanded && (
                      <div className="-mx-4">
                        {g.stories.map((story) => (
                          <StoryCard
                            key={story.id}
                            story={story}
                            authorName={getStoryAuthorName(story)}
                            user_id={user_id}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-2 py-10 text-center">
              <h3 className="text-base font-semibold mb-1">
                No one has passed on the Juice about “{debounced.trim()}” yet
              </h3>
              <p className="text-sm text-muted-foreground mb-5">
                Green flag or red flag — the next guy who looks her up will thank you.
              </p>
              <button
                onClick={() => onCreateStory?.(debounced.trim())}
                className="bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-primary-dark transition-colors"
              >
                Dated her? Be the first
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SubjectLookup;
