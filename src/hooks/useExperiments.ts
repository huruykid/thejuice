import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Server-side experiment switches (public.growth_experiments → active_experiment_keys()).
 *
 * Each growth mechanic checks `useExperiment("<key>")` so a losing experiment can be turned
 * off from the DB (`update growth_experiments set enabled=false where key=…`) without a
 * deploy. Keys are the only thing that leaves the server; hypotheses and notes stay in
 * the admin dashboard.
 *
 * If the RPC fails (offline, logged out, RLS hiccup) we fall back to the round-1 defaults
 * so a flaky network never silently disables the product.
 */
export type ExperimentKey =
  | "miss_interest"
  | "search_alerts"
  | "miss_share"
  | "composer_ladder"
  | "post_share"
  | "attribution";

export const ROUND1_DEFAULTS: ExperimentKey[] = [
  "miss_interest",
  "search_alerts",
  "miss_share",
  "composer_ladder",
  "post_share",
  "attribution",
];

export function useActiveExperiments() {
  return useQuery({
    queryKey: ["active-experiments"],
    staleTime: 5 * 60_000,
    retry: 1,
    queryFn: async (): Promise<Set<string>> => {
      const { data, error } = await (supabase as any).rpc("active_experiment_keys");
      if (error || !Array.isArray(data)) return new Set(ROUND1_DEFAULTS);
      return new Set(data as string[]);
    },
  });
}

export function useExperiment(key: ExperimentKey): boolean {
  const { data } = useActiveExperiments();
  if (!data) return ROUND1_DEFAULTS.includes(key);
  return data.has(key);
}
