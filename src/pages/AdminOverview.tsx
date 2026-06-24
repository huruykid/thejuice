import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useAdminPendingCounts } from "@/hooks/useAdminPendingCounts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, FileText, Flag, ArrowRight, Users, CheckCircle2, BarChart2 } from "lucide-react";

const REFERRAL_LABELS: Record<string, string> = {
  instagram_tiktok: "Instagram / TikTok",
  reddit:           "Reddit",
  google:           "Google",
  friend:           "A friend",
  twitter_x:        "Twitter / X",
  other:            "Other",
};

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

const sevenDaysAgo = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

const useWeeklyActivity = (enabled: boolean) =>
  useQuery({
    queryKey: ["admin-weekly-activity"],
    enabled,
    staleTime: 60_000,
    queryFn: async () => {
      const since = sevenDaysAgo();
      const [signups, verifs, posts, reports] = await Promise.all([
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
      ]);
      return {
        signups: signups.count ?? 0,
        verifications: verifs.count ?? 0,
        posts: posts.count ?? 0,
        reports: reports.count ?? 0,
      };
    },
  });

const AdminOverview = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole(user?.id);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !roleLoading && user && !isAdmin) navigate("/app");
  }, [authLoading, roleLoading, isAdmin, user, navigate]);

  const { data: counts } = useAdminPendingCounts(!!user && isAdmin);
  const { data: weekly } = useWeeklyActivity(!!user && isAdmin);
  const { data: referral } = useReferralBreakdown(!!user && isAdmin);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }
  if (!user || !isAdmin) return null;

  const queueCards = [
    {
      to: "/admin/verifications",
      label: "Pending verifications",
      icon: ShieldCheck,
      count: counts?.verifications ?? 0,
      color: "text-primary",
    },
    {
      to: "/admin/posts",
      label: "Pending posts",
      icon: FileText,
      count: counts?.posts ?? 0,
      color: "text-foreground",
    },
    {
      to: "/admin/reports",
      label: "Pending reports",
      icon: Flag,
      count: counts?.reports ?? 0,
      color: "text-destructive",
    },
  ];

  const weeklyRows = [
    { label: "New signups", value: weekly?.signups ?? 0, icon: Users },
    { label: "Verifications approved", value: weekly?.verifications ?? 0, icon: ShieldCheck },
    { label: "Posts approved", value: weekly?.posts ?? 0, icon: FileText },
    { label: "Reports resolved", value: weekly?.reports ?? 0, icon: CheckCircle2 },
  ];

  return (
    <div className="bg-gradient-soft p-4">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div>
          <h1 className="text-2xl font-bold">Admin overview</h1>
          <p className="text-sm text-muted-foreground">Quick read on what needs attention.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {queueCards.map(({ to, label, icon: Icon, count, color }) => (
            <Link key={to} to={to}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {label}
                    </p>
                    <p className="text-3xl font-bold mt-1">{count}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Icon className={`h-6 w-6 ${color}`} />
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity (last 7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {weeklyRows.map(({ label, value, icon: Icon }) => (
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

        {/* Where are signups coming from? */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart2 className="h-4 w-4" />
              Where users are finding us
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!referral || referral.total === 0 ? (
              <p className="text-sm text-muted-foreground">No responses yet — data appears once users answer the onboarding question.</p>
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
                <li className="text-xs text-muted-foreground pt-1">{referral.total} total responses</li>
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">View as another user type</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Use the floating control at the bottom-right of the screen to preview the app as
              an unverified user, a verified user, or a logged-out visitor. This is a UI-only
              preview — your real admin session stays active.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverview;