import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

const REFERRAL_OPTIONS = [
  { id: "instagram_tiktok", label: "Instagram / TikTok" },
  { id: "reddit",           label: "Reddit" },
  { id: "google",           label: "Google" },
  { id: "friend",           label: "A friend" },
  { id: "twitter_x",        label: "Twitter / X" },
  { id: "other",            label: "Other" },
] as const;

/**
 * One-time "how did you hear about us?" chip selector.
 *
 * Shows EXACTLY once. The first time it would display, we persist
 * `profiles.referral_prompt_dismissed = true` — so it never reappears, even if the user
 * ignores it or taps Skip (previously it re-nagged every session/device). `referral_source`
 * is only written when the user actually picks an option, keeping attribution data clean.
 * (Casts to `any` on the two calls touching the new column until types are regenerated.)
 */
const ReferralPrompt = ({ userId }: { userId: string }) => {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const markedRef = useRef(false);

  // Hidden once the user has answered OR the prompt has already been shown/dismissed.
  const { data: alreadyAnswered, isLoading } = useQuery({
    queryKey: ["referral-answered", userId],
    staleTime: Infinity,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("profiles")
        .select("referral_source, referral_prompt_dismissed")
        .eq("user_id", userId)
        .maybeSingle();
      return !!data?.referral_source || !!data?.referral_prompt_dismissed;
    },
  });

  // Persist "dismissed" the first time the prompt is eligible to show. This runs after the
  // visibility query resolves to "not answered", so the prompt still shows this session and
  // the user can answer — but it will never appear again, even if ignored.
  useEffect(() => {
    if (isLoading || alreadyAnswered || markedRef.current) return;
    markedRef.current = true;
    void (supabase as any)
      .from("profiles")
      .update({ referral_prompt_dismissed: true })
      .eq("user_id", userId)
      .then(() => {});
  }, [isLoading, alreadyAnswered, userId]);

  const handleSelect = async (id: string) => {
    setSaving(true);
    try {
      await supabase
        .from("profiles")
        .update({ referral_source: id })
        .eq("user_id", userId);
      setConfirmed(true);
      // Hide after a brief thank-you moment.
      setTimeout(() => queryClient.setQueryData<boolean>(["referral-answered", userId], true), 1200);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    // Dismissal is already persisted (on first display); just hide it for this session.
    queryClient.setQueryData<boolean>(["referral-answered", userId], true);
  };

  if (isLoading || alreadyAnswered) return null;

  if (confirmed) {
    return (
      <Card className="p-4 bg-card border-border">
        <p className="text-sm text-muted-foreground text-center">Thanks for letting us know! 🙌</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-card border-border">
      <p className="text-sm font-semibold text-foreground mb-3">How did you hear about Juice?</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {REFERRAL_OPTIONS.map(({ id, label }) => (
          <button
            key={id}
            disabled={saving}
            onClick={() => handleSelect(id)}
            className="px-3 py-1.5 rounded-full border border-border text-sm text-foreground hover:bg-primary/10 hover:border-primary transition-colors disabled:opacity-50"
          >
            {label}
          </button>
        ))}
      </div>
      <button
        onClick={handleSkip}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Skip
      </button>
    </Card>
  );
};

export default ReferralPrompt;
