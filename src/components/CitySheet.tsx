import { useEffect, useMemo, useState } from "react";
import { MapPin, Search, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface City {
  id: string;
  city_name: string;
  state_province: string | null;
  country?: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect?: (city: City) => void;
  currentCityId?: string | null;
}

/**
 * Bottom-sheet city picker. Searches the existing `cities` table by name
 * (typeahead) and persists the choice to `profiles.city_id`.
 * NO device GPS — this is a tag, not a location permission.
 */
const CitySheet = ({ open, onClose, onSelect, currentCityId }: Props) => {
  const [q, setQ] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  const { data: cities = [], isLoading } = useQuery({
    queryKey: ["cities", "search", q],
    enabled: open,
    queryFn: async () => {
      let query = supabase
        .from("cities")
        .select("id, city_name, state_province")
        .order("city_name", { ascending: true })
        .limit(40);
      if (q.trim()) query = query.ilike("city_name", `%${q.trim()}%`);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as City[];
    },
  });

  const setCity = useMutation({
    mutationFn: async (city: City) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("profiles")
        .update({ city_id: city.id } as any)
        .eq("user_id", user.id);
      if (error) throw error;
      return city;
    },
    onSuccess: (city) => {
      qc.invalidateQueries({ queryKey: ["user-profile"] });
      qc.invalidateQueries({ queryKey: ["stories", "by-city"] });
      toast({ title: "City updated", description: `${city.city_name} set as your city.` });
      onSelect?.(city);
      onClose();
    },
    onError: (e: any) => {
      const raw: string = e?.message ?? "";
      let friendly = "Something went wrong saving your city. Please try again.";
      if (/reserved/i.test(raw) || /username/i.test(raw)) {
        friendly =
          "Your profile username is blocking this save. Open Profile and change your username, then pick a city again.";
      } else if (/permission|denied|rls/i.test(raw)) {
        friendly = "You don't have permission to update this profile.";
      } else if (/network|fetch/i.test(raw)) {
        friendly = "Network issue — check your connection and try again.";
      }
      toast({ title: "Couldn't update city", description: friendly, variant: "destructive" });
    },
  });

  // FALLBACK ONLY: when the typed city isn't in the `cities` table (e.g. international users),
  // let them save it as free text on profiles.city with a null city_id. This does NOT touch the
  // cities table, the DB-city selection path above, or the city_id-based feed filter — a free-text
  // city simply has no city_id and won't appear as a feed filter chip.
  const setFreeTextCity = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error("Not signed in");
      const trimmed = name.trim();
      const { error } = await supabase
        .from("profiles")
        .update({ city: trimmed, city_id: null } as any)
        .eq("user_id", user.id);
      if (error) throw error;
      return trimmed;
    },
    onSuccess: (name) => {
      qc.invalidateQueries({ queryKey: ["user-profile"] });
      qc.invalidateQueries({ queryKey: ["stories", "by-city"] });
      toast({ title: "City updated", description: `${name} set as your city.` });
      onClose();
    },
    onError: () =>
      toast({ title: "Couldn't update city", description: "Please try again.", variant: "destructive" }),
  });

  const filtered = useMemo(() => cities, [cities]);
  const typed = q.trim();
  const showFreeText =
    typed.length >= 2 && !filtered.some((c) => c.city_name.toLowerCase() === typed.toLowerCase());

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md max-h-[80vh] flex flex-col bg-background border-t border-border rounded-t-2xl sm:rounded-2xl sm:mb-8 animate-in slide-in-from-bottom duration-200">
        <div className="flex flex-col items-center pt-2 pb-3 border-b border-border">
          <div className="h-1 w-10 bg-border rounded-full mb-3" />
          <div className="flex items-center justify-between w-full px-4">
            <h2 className="text-base font-semibold">Pick your city</h2>
            <button onClick={onClose} aria-label="Close" className="p-1 -mr-1 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search a city"
              className="w-full bg-muted text-foreground placeholder:text-muted-foreground rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Loading…</div>
          ) : (
            <>
              {filtered.length > 0 && (
                <ul className="divide-y divide-border">
                  {filtered.map((c) => {
                    const isCurrent = c.id === currentCityId;
                    return (
                      <li key={c.id}>
                        <button
                          onClick={() => setCity.mutate(c)}
                          disabled={setCity.isPending}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-card-hover text-left transition-colors"
                        >
                          <span className="flex items-center gap-3">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>
                              <span className="text-sm font-medium text-foreground">{c.city_name}</span>
                              {c.state_province && (
                                <span className="text-xs text-muted-foreground ml-1.5">
                                  {c.state_province}
                                </span>
                              )}
                            </span>
                          </span>
                          {isCurrent && (
                            <span className="text-[11px] uppercase font-semibold text-primary">
                              Current
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* Fallback for cities not in our list (e.g. international) */}
              {showFreeText && (
                <button
                  onClick={() => setFreeTextCity.mutate(typed)}
                  disabled={setFreeTextCity.isPending}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-card-hover border-t border-border transition-colors"
                >
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm text-foreground">
                    Use “<span className="font-medium">{typed}</span>”
                    <span className="text-xs text-muted-foreground ml-1.5">— my city isn’t listed</span>
                  </span>
                </button>
              )}

              {filtered.length === 0 && !showFreeText && (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  {typed.length === 0 ? "Search for your city." : "Keep typing…"}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CitySheet;