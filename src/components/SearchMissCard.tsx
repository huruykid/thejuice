import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BellRing, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { track } from "@/lib/analytics";
import { shareInvite } from "@/lib/share";
import { useExperiment } from "@/hooks/useExperiments";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The search miss — the moment of highest intent in the app (≈400/week vs <1 post/week).
 * One card, three exits, each an experiment with its own switch (GROWTH_EXPERIMENTS.md):
 *
 *  - miss_interest:  "N other members looked her up this month" — real, aggregate, and
 *                    only shown at ≥2 (subject_search_interest()). Proof the post gets read.
 *  - search_alerts:  "Alert me when someone posts about her" — one tap, turns a dead end
 *                    into a reason to come back; paid off by search-alert-notify.
 *  - miss_share:     "Ask your group chat" — the habit already exists; the link carries
 *                    the member's ref code so we can see if it brings anyone in. The share
 *                    text uses the name the member typed (they're asking friends about her,
 *                    which is the product) but nothing else.
 *
 * "Dated her? Be the first" stays the primary action on every variant.
 */
interface SearchMissCardProps {
  name: string;
  userId?: string;
  /** Opens the composer prefilled with the name. */
  onCreateStory?: (subjectName: string) => void;
  /** Pending users have already submitted a selfie; unverified haven't. Copy differs. */
  pending?: boolean;
  /** Unverified users only: secondary path to read instead of post. */
  onStartVerification?: () => void;
  /** "verified" renders the roomier Home variant; "gated" the compact card. */
  variant?: "verified" | "gated";
}

const SearchMissCard = ({
  name,
  userId,
  onCreateStory,
  pending = false,
  onStartVerification,
  variant = "gated",
}: SearchMissCardProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const showInterest = useExperiment("miss_interest");
  const showAlerts = useExperiment("search_alerts");
  const showShare = useExperiment("miss_share");
  const [saving, setSaving] = useState(false);

  const norm = name.trim();

  const { data: interest } = useQuery({
    queryKey: ["subject-interest", norm.toLowerCase()],
    enabled: showInterest && norm.length >= 2,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<{ searchers: number; alerts: number }> => {
      const { data, error } = await (supabase as any).rpc("subject_search_interest", { q: norm });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return { searchers: Number(row?.searchers ?? 0), alerts: Number(row?.alerts ?? 0) };
    },
  });

  const { data: hasAlert = false } = useQuery({
    queryKey: ["search-alert", userId, norm.toLowerCase()],
    enabled: showAlerts && !!userId && norm.length >= 2,
    staleTime: 60_000,
    queryFn: async (): Promise<boolean> => {
      const { data } = await (supabase as any)
        .from("search_alerts")
        .select("id")
        .eq("user_id", userId)
        .eq("norm_name", norm.toLowerCase())
        .maybeSingle();
      return !!data;
    },
  });

  const createAlert = async () => {
    if (!userId || saving) return;
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("search_alerts")
        .upsert({ user_id: userId, subject_name: norm }, { onConflict: "user_id,norm_name", ignoreDuplicates: true });
      if (error) throw error;
      void track("search_alert_created", { name: norm });
      queryClient.setQueryData(["search-alert", userId, norm.toLowerCase()], true);
      toast({
        title: "You'll be the first to know",
        description: `We'll email you the moment a verified member posts about ${norm}.`,
      });
    } catch {
      toast({ title: "Couldn't save that alert", description: "Try again in a moment.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const share = async () => {
    if (!userId) return;
    const result = await shareInvite({
      userId,
      surface: "miss",
      text: `Anyone got juice on ${norm}? Verified guys only — look her up before the date:`,
    });
    if (result === "copied") toast({ title: "Link copied", description: "Paste it in the group chat." });
    if (result === "failed") toast({ title: "Couldn't share", description: "Copy the link from your profile instead.", variant: "destructive" });
  };

  const interestLine =
    showInterest && interest && interest.searchers >= 2
      ? `${interest.searchers} other members looked her up this month${interest.alerts > 0 ? ` · ${interest.alerts} waiting on a post` : ""}.`
      : showInterest && interest && interest.alerts > 0
        ? `${interest.alerts} member${interest.alerts === 1 ? " is" : "s are"} waiting on a post about her.`
        : null;

  const wide = variant === "verified";

  return (
    <Card className={cn("bg-card border-border", wide ? "p-5 text-center" : "p-5 text-center")}>
      <p className={cn("font-semibold text-foreground", wide ? "text-base" : "text-sm")}>
        No one has passed on the Juice about “{norm}” yet.
      </p>
      {interestLine && (
        <p className="text-sm text-primary font-medium mt-1" aria-live="polite">
          {interestLine}
        </p>
      )}
      <p className="text-sm text-muted-foreground mt-1 mb-3">
        {wide
          ? "Green flag or red flag — the next guy who looks her up will thank you."
          : pending
            ? "Post it now — it goes live the moment you're approved."
            : "Post it now — it's saved and goes live once your selfie is approved."}
      </p>

      {onCreateStory && (
        <Button onClick={() => onCreateStory(norm)} className="w-full">
          Dated her? Be the first
        </Button>
      )}

      {userId && (showAlerts || showShare) && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          {showAlerts && (
            <Button
              type="button"
              variant="outline"
              onClick={createAlert}
              disabled={saving || hasAlert}
              aria-pressed={hasAlert}
              className={cn("min-h-11 text-xs", hasAlert && "border-primary/60 text-primary")}
            >
              {hasAlert ? <BellRing className="h-4 w-4 mr-1.5" /> : <Bell className="h-4 w-4 mr-1.5" />}
              {hasAlert ? "Alert on" : "Alert me"}
            </Button>
          )}
          {showShare && (
            <Button type="button" variant="outline" onClick={share} className="min-h-11 text-xs">
              <Send className="h-4 w-4 mr-1.5" />
              Ask the group chat
            </Button>
          )}
        </div>
      )}
      {showAlerts && userId && !hasAlert && (
        <p className="text-[11px] text-muted-foreground mt-2">
          Alert = one email when a verified member posts about this name. Nothing else.
        </p>
      )}

      {!pending && onStartVerification && (
        <button
          onClick={onStartVerification}
          className="mt-1 block w-full min-h-11 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Just want to read? Verify with a selfie
        </button>
      )}
    </Card>
  );
};

export default SearchMissCard;
