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
    onError: (e: any) =>
      toast({ title: "Couldn't update city", description: e?.message, variant: "destructive" }),
  });

  const filtered = useMemo(() => cities, [cities]);

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
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No matches.</div>
          ) : (
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
        </div>
      </div>
    </div>
  );
};

export default CitySheet;