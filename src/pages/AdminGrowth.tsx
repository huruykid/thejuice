import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/**
 * /admin/growth — the readout for the growth experimentation system (GROWTH_EXPERIMENTS.md).
 *
 * Three things, in the order a weekly review reads them:
 *  1. The 45-day goal (10 genuine posts by 2026-11-08) against the pace line.
 *  2. The weekly funnel from growth_weekly_funnel(), with the rate columns each experiment
 *     is judged on, coloured against the target.
 *  3. The experiment registry with its kill switches (growth_experiments.enabled).
 *
 * Everything is real data from our own tables. Visitor counts live in Lovable/GA and are
 * not shown here on purpose — no number on this page is estimated.
 */

const GOAL = { posts: 10, start: "2026-09-24", end: "2026-11-08" } as const;

type FunnelRow = {
  week: string;
  signups: number;
  attributed_signups: number;
  ref_signups: number;
  verif_submitted: number;
  verif_approved: number;
  active_users: number;
  searchers: number;
  search_hits: number;
  search_misses: number;
  alerts_created: number;
  composer_opens: number;
  composer_openers: number;
  composer_abandons: number;
  posts_submitted: number;
  posts_approved: number;
  posters: number;
  shares: number;
  w1_returned: number;
  median_hours_signup_to_post: number | null;
};

type Experiment = {
  key: string;
  name: string;
  hypothesis: string;
  primary_metric: string;
  target: string;
  status: "planned" | "running" | "paused" | "won" | "lost" | "kept";
  enabled: boolean;
  started_at: string;
  ended_at: string | null;
  result_notes: string | null;
};

const pct = (num: number, den: number) => (den > 0 ? (100 * num) / den : null);
const fmtPct = (v: number | null) => (v == null ? "—" : `${v.toFixed(v < 10 ? 1 : 0)}%`);

/** Rate columns with the target each experiment is judged against. */
const RATES: Array<{
  label: string;
  hint: string;
  value: (r: FunnelRow) => number | null;
  target: number; // percent
  minDen: (r: FunnelRow) => number;
}> = [
  {
    label: "Signup → selfie",
    hint: "verif_submitted / signups",
    value: (r) => pct(r.verif_submitted, r.signups),
    target: 60,
    minDen: (r) => r.signups,
  },
  {
    label: "Miss → composer",
    hint: "composer_opens / search_misses — miss_interest experiment, target 5%",
    value: (r) => pct(r.composer_opens, r.search_misses),
    target: 5,
    minDen: (r) => r.search_misses,
  },
  {
    label: "Composer → post",
    hint: "posts_submitted / composer_opens — composer_ladder experiment, target 15%",
    value: (r) => pct(r.posts_submitted, r.composer_opens),
    target: 15,
    minDen: (r) => r.composer_opens,
  },
  {
    label: "Alerts / miss",
    hint: "alerts_created / search_misses — search_alerts experiment, target 15%",
    value: (r) => pct(r.alerts_created, r.search_misses),
    target: 15,
    minDen: (r) => r.search_misses,
  },
  {
    label: "Posters who share",
    hint: "shares / posts_submitted (all surfaces) — post_share experiment, target 30%",
    value: (r) => pct(r.shares, r.posts_submitted),
    target: 30,
    minDen: (r) => r.posts_submitted,
  },
  {
    label: "W1 return",
    hint: "returned 1–7 days after signup / signups — target 20% (baseline ~10%)",
    value: (r) => pct(r.w1_returned, r.signups),
    target: 20,
    minDen: (r) => r.signups,
  },
  {
    label: "Attributed signups",
    hint: "signups with ref/utm/referrer — attribution experiment, target 40%",
    value: (r) => pct(r.attributed_signups, r.signups),
    target: 40,
    minDen: (r) => r.signups,
  },
];

const STATUS_STYLES: Record<Experiment["status"], string> = {
  planned: "bg-muted text-muted-foreground",
  running: "bg-primary/15 text-primary",
  paused: "bg-muted text-muted-foreground",
  won: "bg-success/15 text-success",
  kept: "bg-success/15 text-success",
  lost: "bg-destructive/15 text-destructive",
};

const AdminGrowth = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const funnel = useQuery({
    queryKey: ["admin-growth-funnel"],
    staleTime: 60_000,
    queryFn: async (): Promise<FunnelRow[]> => {
      const { data, error } = await (supabase as any).rpc("growth_weekly_funnel", { weeks: 10 });
      if (error) throw error;
      return (data ?? []) as FunnelRow[];
    },
  });

  const abandons = useQuery({
    queryKey: ["admin-growth-abandons"],
    staleTime: 60_000,
    queryFn: async (): Promise<Array<{ missing: string; abandons: number }>> => {
      const { data, error } = await (supabase as any).rpc("growth_composer_abandon_reasons", { days: 30 });
      if (error) throw error;
      return data ?? [];
    },
  });

  const experiments = useQuery({
    queryKey: ["admin-growth-experiments"],
    staleTime: 60_000,
    queryFn: async (): Promise<Experiment[]> => {
      const { data, error } = await (supabase as any)
        .from("growth_experiments")
        .select("*")
        .order("started_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Experiment[];
    },
  });

  const goalPosts = useQuery({
    queryKey: ["admin-growth-goal-posts"],
    staleTime: 60_000,
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from("stories")
        .select("id", { count: "exact", head: true })
        .eq("is_seed", false)
        .not("user_id", "is", null)
        .gte("created_at", `${GOAL.start}T00:00:00Z`);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ key, enabled }: { key: string; enabled: boolean }) => {
      const { error } = await (supabase as any)
        .from("growth_experiments")
        .update({ enabled, updated_at: new Date().toISOString() })
        .eq("key", key);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      queryClient.invalidateQueries({ queryKey: ["admin-growth-experiments"] });
      queryClient.invalidateQueries({ queryKey: ["active-experiments"] });
      toast({ title: v.enabled ? "Experiment on" : "Experiment off", description: `${v.key} takes effect on next load.` });
    },
    onError: (e: Error) => toast({ title: "Couldn't update", description: e.message, variant: "destructive" }),
  });

  const pace = useMemo(() => {
    const start = new Date(GOAL.start).getTime();
    const end = new Date(GOAL.end).getTime();
    const now = Date.now();
    const elapsed = Math.min(Math.max((now - start) / (end - start), 0), 1);
    const daysLeft = Math.max(Math.ceil((end - now) / 86_400_000), 0);
    return { expected: GOAL.posts * elapsed, elapsedPct: elapsed * 100, daysLeft };
  }, []);

  const rows = funnel.data ?? [];
  const posts = goalPosts.data ?? 0;
  const onTrack = posts >= Math.floor(pace.expected);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Growth"
        subtitle="Weekly funnel, the 45-day goal, and the experiment switches. Playbook: GROWTH_EXPERIMENTS.md"
      />

      {/* 1. The goal */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">45-day goal — {GOAL.posts} genuine posts by {GOAL.end}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="text-4xl font-bold">
                {posts}
                <span className="text-lg text-muted-foreground font-normal"> / {GOAL.posts}</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Pace says {pace.expected.toFixed(1)} by today · {pace.daysLeft} days left ·{" "}
                <span className={cn("font-semibold", onTrack ? "text-success" : "text-destructive")}>
                  {onTrack ? "on track" : "behind pace"}
                </span>
              </p>
            </div>
            <div className="text-xs text-muted-foreground max-w-sm">
              Counts member-submitted, non-seed stories created since {GOAL.start} (any status — moderation
              lag shouldn't hide supply). Check-ins: day 15 ≥ 3 · day 30 ≥ 6 · day 45 ≥ 10.
            </div>
          </div>
          <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden relative">
            <div className="h-full bg-primary" style={{ width: `${Math.min((100 * posts) / GOAL.posts, 100)}%` }} />
            <div className="absolute top-0 h-full w-0.5 bg-foreground/60" style={{ left: `${pace.elapsedPct}%` }} title="pace" />
          </div>
        </CardContent>
      </Card>

      {/* 2. Weekly funnel */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Weekly funnel</CardTitle>
          <p className="text-xs text-muted-foreground">
            Rates are coloured against target once the denominator is ≥ 20. Visitors are in Lovable/GA.
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {funnel.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : funnel.isError ? (
            <p className="text-sm text-destructive">Couldn't load the funnel.</p>
          ) : (
            <table className="w-full text-xs whitespace-nowrap">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3 font-medium">Week</th>
                  <th className="py-2 pr-3 font-medium">Signups</th>
                  <th className="py-2 pr-3 font-medium">Selfies</th>
                  <th className="py-2 pr-3 font-medium">Approved</th>
                  <th className="py-2 pr-3 font-medium">Active</th>
                  <th className="py-2 pr-3 font-medium">Searchers</th>
                  <th className="py-2 pr-3 font-medium">Misses</th>
                  <th className="py-2 pr-3 font-medium">Hits</th>
                  <th className="py-2 pr-3 font-medium">Alerts</th>
                  <th className="py-2 pr-3 font-medium">Composer</th>
                  <th className="py-2 pr-3 font-medium">Abandons</th>
                  <th className="py-2 pr-3 font-medium">Posts</th>
                  <th className="py-2 pr-3 font-medium">Shares</th>
                  <th className="py-2 pr-3 font-medium">Ref signups</th>
                  <th className="py-2 pr-3 font-medium">Median h → post</th>
                  {RATES.map((r) => (
                    <th key={r.label} className="py-2 pr-3 font-medium" title={r.hint}>
                      {r.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.week} className="border-b border-border/60">
                    <td className="py-2 pr-3 font-medium">{r.week}</td>
                    <td className="py-2 pr-3">{r.signups}</td>
                    <td className="py-2 pr-3">{r.verif_submitted}</td>
                    <td className="py-2 pr-3">{r.verif_approved}</td>
                    <td className="py-2 pr-3">{r.active_users}</td>
                    <td className="py-2 pr-3">{r.searchers}</td>
                    <td className="py-2 pr-3">{r.search_misses}</td>
                    <td className="py-2 pr-3">{r.search_hits}</td>
                    <td className="py-2 pr-3">{r.alerts_created}</td>
                    <td className="py-2 pr-3">
                      {r.composer_opens}
                      <span className="text-muted-foreground"> ({r.composer_openers})</span>
                    </td>
                    <td className="py-2 pr-3">{r.composer_abandons}</td>
                    <td className="py-2 pr-3 font-semibold">
                      {r.posts_submitted}
                      <span className="text-muted-foreground font-normal"> ({r.posts_approved} live)</span>
                    </td>
                    <td className="py-2 pr-3">{r.shares}</td>
                    <td className="py-2 pr-3">{r.ref_signups}</td>
                    <td className="py-2 pr-3">{r.median_hours_signup_to_post ?? "—"}</td>
                    {RATES.map((rate) => {
                      const v = rate.value(r);
                      const enough = rate.minDen(r) >= 20;
                      const hit = v != null && v >= rate.target;
                      return (
                        <td
                          key={rate.label}
                          className={cn(
                            "py-2 pr-3",
                            enough && v != null && (hit ? "text-success font-semibold" : "text-destructive")
                          )}
                        >
                          {fmtPct(v)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* 2b. Why the composer loses people */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Composer abandons — what was still empty (30d)</CardTitle>
          <p className="text-xs text-muted-foreground">
            From composer_abandoned events. The biggest bar is the field to fix next; "photo" is the founder's
            required gate, so if it dominates the fix is making the photo easier, not optional.
          </p>
        </CardHeader>
        <CardContent>
          {(abandons.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No abandons logged yet — starts accumulating from this deploy.</p>
          ) : (
            <ul className="space-y-1.5">
              {(abandons.data ?? []).map((a) => {
                const max = Math.max(...(abandons.data ?? []).map((x) => x.abandons), 1);
                return (
                  <li key={a.missing} className="flex items-center gap-3 text-sm">
                    <span className="w-16 capitalize">{a.missing}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${(100 * a.abandons) / max}%` }} />
                    </div>
                    <span className="w-8 text-right tabular-nums">{a.abandons}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* 3. Experiments */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Experiments</CardTitle>
          <p className="text-xs text-muted-foreground">
            The switch turns a mechanic off for members on their next load — no deploy. Status and result notes
            are written at each weekly readout.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {(experiments.data ?? []).map((e) => (
            <div key={e.key} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{e.name}</p>
                    <code className="text-[11px] text-muted-foreground">{e.key}</code>
                    <Badge className={cn("text-[10px]", STATUS_STYLES[e.status])}>{e.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{e.hypothesis}</p>
                  <p className="text-xs mt-1">
                    <span className="text-muted-foreground">Metric:</span> {e.primary_metric} ·{" "}
                    <span className="text-muted-foreground">Target:</span> {e.target}
                  </p>
                  {e.result_notes && <p className="text-xs mt-1 italic">{e.result_notes}</p>}
                </div>
                <Switch
                  checked={e.enabled}
                  onCheckedChange={(v) => toggle.mutate({ key: e.key, enabled: v })}
                  aria-label={`Toggle ${e.name}`}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminGrowth;
