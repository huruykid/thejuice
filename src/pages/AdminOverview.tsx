import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useAdminPendingCounts } from "@/hooks/useAdminPendingCounts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck, FileText, Flag, ArrowRight, Users,
  CheckCircle2, BarChart2, Scale, Filter,
} from "lucide-react";

// ─── Constants ───────────────────────────────────────────────────────────────

const REFERRAL_LABELS: Record<string, string> = {
  instagram_tiktok: "Instagram / TikTok",
  reddit:           "Reddit",
  google:           "Google",
  friend:           "A friend",
  twitter_x:        "Twitter / X",
  other:            "Other",
};

const RANGES = [
  { label: "7d",  days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
] as const;

type RangeDays = 7 | 30 | 90;

const daysAgo = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

// ─── Hooks ───────────────────────────────────────────────────────────────────

const useLifetimeTotals = (enabled: boolean) =>
  useQuery({
    queryKey: ["admin-lifetime-totals"],
    enabled,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const [members, verified, posts] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase
          .from("user_verifications")
          .select("id", { count: "exact", head: true })
          .eq("verification_status", "approved"),
        supabase
          .from("stories")
          .select("id", { count: "exact", head: true })
          .eq("status", "approved")
          .eq("is_seed", false),
      ]);
      return {
        members:    members.count  ?? 0,
        verified:   verified.count ?? 0,
        posts:      posts.count    ?? 0,
      };
    },
  });

const useActivityMetrics = (enabled: boolean, days: RangeDays) =>
  useQuery({
    queryKey: ["admin-activity", days],
    enabled,
    staleTime: 60_000,
    queryFn: async () => {
      const since = daysAgo(days);
      const [signups, verifs, posts, reports, disputes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .gte("created_at", since),
        supabase
          .from("user_verifications")
          .select("id", { count: "exact", head: true })
          .eq("verification_status", "approved")
          .gte("updated_at", since),
        supabase
          .from("stories")
          .select("id", { count: "exact", head: true })
          .eq("status", "approved")
          .eq("is_seed", false)
          .gte("approved_at", since),
        supabase
          .from("reports")
          .select("id", { count: "exact", head: true })
          .in("status", ["action_taken", "dismissed"])
          .gte("reviewed_at", since),
        supabase
          .from("dispute_requests")
          .select("id", { count: "exact", head: true })
          .in("status", ["approved", "rejected"])
          .gte("reviewed_at", since),
      ]);
      return {
        signups:      signups.count   ?? 0,
        verifications: verifs.count   ?? 0,
        posts:        posts.count     ?? 0,
        reports:      reports.count   ?? 0,
        disputes:     disputes.count   ?? 0,
      };
    },
  });

const useReferralBreakdown = (enabled: boolean) =>
  useQuery({
    queryKey: ["admin-referral-breakdown"],
    enabled,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("referral_source")
        .not("referral_source", "is", null);
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const row of data ?? []) {
        const key = row.referral_source ?? "other";
        counts[key] = (counts[key] ?? 0) + 1;
      }
      const total = Object.values(counts).reduce((s, n) => s + n, 0);
      return { counts, total };
    },
  });

// ─── Component ───────────────────────────────────────────────────────────────

const AdminOverview = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole(user?.id);
  const navigate = useNavigate();
  const [rangeDays, setRangeDays] = useState<RangeDays>(7);

  useEffect(() => {
    if (!authLoading && !roleLoading && user && !isAdmin) navigate("/app");
  }, [authLoading, roleLoading, isAdmin, user, navigate]);

  const enabled = !!user && isAdmin;
  const { data: counts }   = useAdminPendingCounts(enabled);
  const { data: lifetime } = useLifetimeTotals(enabled);
  const { data: activity } = useActivityMetrics(enabled, rangeDays);
  const { data: referral } = useReferralBreakdown(enabled);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }
  if (!user || !isAdmin) return null;

  // ── Conversion funnel ──────────────────────────────────────────────────────
  const members  = lifetime?.members  ?? 0;
  const verified = lifetime?.verified ?? 0;
  const posted   = lifetime?.posts    ?? 0;
  // Step-to-step rates for labels ("X% of verified")
  const verifyRate   = members  > 0 ? Math.round((verified / members)  * 100) : 0;
  const postRate     = verified > 0 ? Math.round((posted   / verified) * 100) : 0;
  // Bar widths all relative to total members so bars never visually exceed the step above them
  const verifyBarPct = members  > 0 ? Math.round((verified / members)  * 100) : 0;
  const postBarPct   = members  > 0 ? Math.round((posted   / members)  * 100) : 0;

  const funnelSteps = [
    { label: "Signed up", value: members,  barPct: 100,          displayPct: null,       color: "bg-primary" },
    { label: "Verified",  value: verified, barPct: verifyBarPct, displayPct: verifyRate, color: "bg-primary/70" },
    { label: "Posted",    value: posted,   barPct: postBarPct,   displayPct: postRate,   color: "bg-primary/40" },
  ];

  // ── Queue cards ────────────────────────────────────────────────────────────
  const queueCards = [
    { to: "/admin/verifications", label: "Pending verifications", icon: ShieldCheck, count: counts?.verifications ?? 0, color: "text-primary" },
    { to: "/admin/posts",         label: "Pending posts",         icon: FileText,    count: counts?.posts          ?? 0, color: "text-foreground" },
    { to: "/admin/reports",       label: "Pending reports",       icon: Flag,        count: counts?.reports        ?? 0, color: "text-destructive" },
    { to: "/admin/disputes",      label: "Pending disputes",      icon: Scale,       count: counts?.disputes       ?? 0, color: "text-orange-500" },
  ];

  // ── Activity rows ──────────────────────────────────────────────────────────
  const activityRows = [
    { label: "New signups",             value: activity?.signups       ?? 0, icon: Users },
    { label: "Verifications approved",  value: activity?.verifications ?? 0, icon: ShieldCheck },
    { label: "Posts approved",          value: activity?.posts         ?? 0, icon: FileText },
    { label: "Reports resolved",        value: activity?.reports       ?? 0, icon: CheckCircle2 },
    { label: "Disputes resolved",       value: activity?.disputes      ?? 0, icon: Scale },
  ];

  return (
    <div className="bg-gradient-soft p-4 pb-10">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Admin overview</h1>
          <p className="text-sm text-muted-foreground">Quick read on what needs attention.</p>
        </div>

        {/* Lifetime stat bar */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total members",        value: members },
            { label: "Verified members",     value: verified },
            { label: "Published stories",    value: posted },
          ].map(({ label, value }) => (
            <Card key={label}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
                <p className="text-2xl font-bold mt-1">{value.toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Queue cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {queueCards.map(({ to, label, icon: Icon, count, color }) => (
            <Link key={to} to={to}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground leading-tight">
                      {label}
                    </p>
                    <p className={`text-3xl font-bold mt-1 ${count > 0 ? color : "text-foreground"}`}>
                      {count}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Icon className={`h-5 w-5 ${count > 0 ? color : "text-muted-foreground"}`} />
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Conversion funnel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Activation funnel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {funnelSteps.map(({ label, value, barPct, displayPct, color }, i) => (
              <div key={label} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-semibold">
                    {value.toLocaleString()}
                    {displayPct !== null && (
                      <span className="text-muted-foreground font-normal ml-1.5">
                        ({displayPct}% of {funnelSteps[i - 1].label.toLowerCase()})
                      </span>
                    )}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full transition-all duration-500`}
                    style={{ width: `${barPct}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Activity metrics with date range toggle */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Activity</CardTitle>
              <div className="flex gap-1">
                {RANGES.map(({ label, days }) => (
                  <Button
                    key={days}
                    variant={rangeDays === days ? "default" : "ghost"}
                    size="sm"
                    className="h-7 px-2.5 text-xs"
                    onClick={() => setRangeDays(days)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {activityRows.map(({ label, value, icon: Icon }) => (
                <li key={label} className="flex items-center justify-between py-3 text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Icon className="h-4 w-4" />
                    {label}
                  </span>
                  <span className="font-semibold">{value}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Referral breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart2 className="h-4 w-4" />
              Where users are finding us
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!referral || referral.total === 0 ? (
              <p className="text-sm text-muted-foreground">
                No responses yet — data appears once users answer the onboarding question.
              </p>
            ) : (
              <ul className="space-y-2">
                {Object.entries(referral.counts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([key, count]) => {
                    const pct = Math.round((count / referral.total) * 100);
                    return (
                      <li key={key} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{REFERRAL_LABELS[key] ?? key}</span>
                          <span className="text-muted-foreground">{count} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                <li className="text-xs text-muted-foreground pt-1">
                  {referral.total} total responses
                </li>
              </ul>
            )}
          </CardContent>
        </Card>

        {/* View-as hint */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">View as another user type</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Use the floating control at the bottom-right of the screen to preview the app as
              an unverified user, a verified user, or a logged-out visitor. Your real admin
              session stays active.
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default AdminOverview;
