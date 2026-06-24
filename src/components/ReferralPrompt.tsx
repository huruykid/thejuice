import { useState } from "react";
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
 * Visibility is driven by the DB (`profiles.referral_source IS NULL`), not
 * localStorage — so answering on one device hides it everywhere, and quickly-
 * verified users see it in the full feed instead of losing it on transition.
 */
const ReferralPrompt = ({ userId }: { userId: string }) => {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Check whether this user has already answered.
  const { data: alreadyAnswered, isLoading } = useQuery({
    queryKey: ["referral-answered", userId],
    staleTime: Infinity, // once answered it never changes back
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("referral_source")
        .eq("user_id", userId)
        .maybeSingle();
      return !!data?.referral_source;
    },
  });

  const handleSelect = async (id: string) => {
    setSaving(true);
    try {
      await supabase
        .from("profiles")
        .update({ referral_source: id })
        .eq("user_id", userId);
      // Update the cache so the prompt disappears on every device using this
      // query client instance (i.e. the current session).
      queryClient.setQueryData(["referral-answered", userId], true);
      setConfirmed(true);
      // Hide after a brief thank-you moment.
      setTimeout(() => queryClient.setQueryData(["referral-answered", userId], true), 1000);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    // Mark locally so the prompt disappears this session, but don't write null
    // to the DB — leaving referral_source null means the prompt will reappear
    // on a new device/session, which is acceptable for a skip.
    queryClient.setQueryData(["referral-answered", userId], true);
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
