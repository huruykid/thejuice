import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { sanitizeText, validateStoryContent } from "@/lib/security";
import { FLAG_CATEGORIES, FlagRatingInput, type FlagValue } from "@/components/FlagRating";

/**
 * Public, no-auth submission flow. An anonymous visitor can submit a story
 * (codename only, no real names/phones/photos). It lands in the admin queue
 * as submitted_anonymously=true and is reviewed before going live.
 */
const SharePublic = () => {
  const [codename, setCodename] = useState("");
  const [content, setContent] = useState("");
  const [ack, setAck] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [ratings, setRatings] = useState<Record<string, FlagValue>>({
    communication: 0,
    loyalty: 0,
    vibe: 0,
    respect: 0,
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validateStoryContent(content);
    if (!v.isValid) {
      toast.error(v.error || "Please review your story");
      return;
    }
    if (!ack) {
      toast.error("Please confirm the guidelines first");
      return;
    }
    if (content.trim().length < 150) {
      toast.error("Stories need to be at least 150 characters");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await (supabase as any).from("stories").insert({
        content: sanitizeText(content),
        subject_name: codename ? sanitizeText(codename) : null,
        user_id: null,
        profile_id: null,
        is_seed: false,
        submitted_anonymously: true,
        status: "pending",
        communication_rating: ratings.communication,
        loyalty_rating: ratings.loyalty,
        overall_vibe_rating: ratings.vibe,
        emotional_safety_rating: ratings.respect,
      });
      if (error) throw error;
      setDone(true);
    } catch (err: any) {
      toast.error(err?.message || "Couldn't submit — try again in a moment");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <div className="h-14 w-14 rounded-full bg-primary/15 mx-auto flex items-center justify-center">
            <CheckCircle2 className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-xl font-semibold">Submitted for review</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Thanks. An admin will review your story before it goes live in the
            community feed. Want your own account so you can see the full feed?
          </p>
          <Link to="/app">
            <Button className="w-full">Create an account</Button>
          </Link>
          <Link
            to="/"
            className="text-xs text-muted-foreground hover:text-foreground inline-block"
          >
            Back to home
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Share a story anonymously</h1>
          <p className="text-sm text-muted-foreground mt-1">
            No account required. An admin reviews every submission before it
            goes live.
          </p>
        </div>

        <Card className="p-5 space-y-5">
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="codename">Codename (optional)</Label>
              <Input
                id="codename"
                placeholder="e.g. Bumble Bryan, Hinge Henry"
                value={codename}
                onChange={(e) => setCodename(e.target.value)}
                maxLength={40}
              />
              <p className="text-xs text-muted-foreground">
                No real last names, addresses, workplaces, or phone numbers.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="content">Your story</Label>
              <Textarea
                id="content"
                rows={8}
                placeholder="Allegedly, what happened? Stick to your own experience — no fabrication, no identifying details."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={5000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {content.length} / 5000 · minimum 150
              </p>
            </div>

            <div className="space-y-2">
              <Label>Rate the experience</Label>
              <p className="text-xs text-muted-foreground">
                Tap a green or red flag for each. Skip any you don't want to rate.
              </p>
              {FLAG_CATEGORIES.map((cat) => (
                <FlagRatingInput
                  key={cat.key}
                  category={cat}
                  value={ratings[cat.key]}
                  onChange={(next) =>
                    setRatings((prev) => ({ ...prev, [cat.key]: next }))
                  }
                />
              ))}
            </div>

            <label className="flex gap-2 items-start text-xs text-muted-foreground cursor-pointer">
              <Checkbox
                checked={ack}
                onCheckedChange={(v) => setAck(Boolean(v))}
                className="mt-0.5"
              />
              <span>
                This is my real, <em>alleged</em> experience. I won't fabricate
                or exaggerate, and I won't include details that publicly identify
                someone (last names, addresses, workplaces, phone numbers).
              </span>
            </label>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {submitting ? "Submitting…" : "Submit for review"}
            </Button>
          </form>
        </Card>

        <p className="text-xs text-muted-foreground text-center mt-4">
          <Link to="/" className="hover:text-foreground">Back to home</Link>
        </p>
      </div>
    </div>
  );
};

export default SharePublic;