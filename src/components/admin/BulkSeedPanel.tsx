import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Library, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { SEED_STORY_LIBRARY, type SeedStoryDraft } from "@/lib/seedStoryLibrary";
import { generateSeedImage } from "@/lib/seedAvatar";

/** Matches the max batch size enforced by admin_create_seed_stories_bulk. */
const MAX_BATCH = 50;

const blankDraft = (): SeedStoryDraft => ({
  content: "",
  subject_name: "",
  location: "",
  verdict: 0,
});

/**
 * Bulk seeding. The single-story form above this panel is fine for one-offs, but filling
 * an empty feed one submit at a time is a slog — this takes a whole batch, attaches an
 * image to each (the feed hides image-less stories, see src/lib/seedAvatar.ts), and
 * publishes them through the admin-gated bulk RPC with staggered timestamps.
 */
const BulkSeedPanel = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [drafts, setDrafts] = useState<SeedStoryDraft[]>([]);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const update = (i: number, patch: Partial<SeedStoryDraft>) =>
    setDrafts((d) => d.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  const removeAt = (i: number) => setDrafts((d) => d.filter((_, idx) => idx !== i));

  const loadLibrary = () => {
    setDrafts(SEED_STORY_LIBRARY.map((s) => ({ ...s })));
    toast.success(`Loaded ${SEED_STORY_LIBRARY.length} starter stories — edit or drop any before publishing`);
  };

  /** Blank-line-separated paragraphs become one draft each. */
  const applyPaste = () => {
    const parsed = pasteText
      .split(/\n\s*\n/)
      .map((chunk) => chunk.trim())
      .filter(Boolean)
      .map((content) => ({ ...blankDraft(), content }));
    if (parsed.length === 0) {
      toast.error("Nothing to import — separate stories with a blank line");
      return;
    }
    setDrafts((d) => [...d, ...parsed]);
    setPasteText("");
    setPasteOpen(false);
    toast.success(`Added ${parsed.length} draft${parsed.length === 1 ? "" : "s"}`);
  };

  const publish = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const ready = drafts.filter((d) => d.content.trim());
      if (ready.length === 0) throw new Error("No stories to publish");

      setProgress({ done: 0, total: ready.length });

      // An image per story, uploaded under the admin's own folder — the storage RLS path
      // that works, same as the single-story form.
      const withImages: Array<Record<string, unknown>> = [];
      for (let i = 0; i < ready.length; i++) {
        const d = ready[i];
        const blob = await generateSeedImage(`${d.subject_name}|${d.content.slice(0, 40)}`);
        const path = `${user.id}/seed-${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
        const { error: upErr } = await supabase.storage
          .from("story-images")
          .upload(path, blob, { contentType: "image/png" });
        if (upErr) throw upErr;

        withImages.push({
          content: d.content.trim(),
          subject_name: d.subject_name.trim() || null,
          location: d.location.trim() || null,
          verdict: d.verdict,
          // Same JSON-array-of-paths shape the normal post flow writes.
          image_url: JSON.stringify([path]),
        });
        setProgress({ done: i + 1, total: ready.length });
      }

      let inserted = 0;
      for (let i = 0; i < withImages.length; i += MAX_BATCH) {
        const chunk = withImages.slice(i, i + MAX_BATCH);
        const { data, error } = await supabase.rpc("admin_create_seed_stories_bulk", {
          p_stories: chunk as unknown as Json,
        });
        if (error) throw error;
        inserted += data ?? 0;
      }
      return inserted;
    },
    onSuccess: (inserted) => {
      toast.success(`Published ${inserted} stor${inserted === 1 ? "y" : "ies"} to the feed`);
      setDrafts([]);
      setProgress(null);
      queryClient.invalidateQueries({ queryKey: ["admin-seed-stories"] });
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
    onError: (e: unknown) => {
      setProgress(null);
      toast.error(e instanceof Error ? e.message : "Failed to publish batch");
    },
  });

  const readyCount = drafts.filter((d) => d.content.trim()).length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Bulk add</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={loadLibrary}>
            <Library className="h-4 w-4 mr-1.5" />
            Load starter library ({SEED_STORY_LIBRARY.length})
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setPasteOpen((o) => !o)}
          >
            <Wand2 className="h-4 w-4 mr-1.5" />
            Paste stories
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setDrafts((d) => [...d, blankDraft()])}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add blank
          </Button>
        </div>

        {pasteOpen && (
          <div className="space-y-2 rounded-lg border border-border p-3">
            <Label htmlFor="bulk-paste" className="text-xs">
              One story per paragraph, separated by a blank line
            </Label>
            <Textarea
              id="bulk-paste"
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={6}
              placeholder={"First story…\n\nSecond story…"}
            />
            <Button type="button" size="sm" onClick={applyPaste}>
              Add to batch
            </Button>
          </div>
        )}

        {drafts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing staged. Load the starter library or paste your own, then review each one
            before publishing. Every story gets an illustrated image automatically — the feed
            hides stories without one.
          </p>
        ) : (
          <div className="space-y-3">
            {drafts.map((d, i) => (
              <div key={i} className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <Textarea
                    value={d.content}
                    onChange={(e) => update(i, { content: e.target.value })}
                    rows={5}
                    // Reviewing 24 stories means reading them; at 3 rows the narrow
                    // breakpoint clipped every one of them mid-sentence.
                    className="min-h-32 sm:min-h-24"
                    placeholder="What happened…"
                    aria-label={`Story ${i + 1} content`}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => removeAt(i)}
                    aria-label={`Remove story ${i + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input
                    value={d.subject_name}
                    onChange={(e) => update(i, { subject_name: e.target.value })}
                    placeholder="About (optional)"
                    aria-label={`Story ${i + 1} subject`}
                  />
                  <Input
                    value={d.location}
                    onChange={(e) => update(i, { location: e.target.value })}
                    placeholder="e.g. Austin, TX"
                    aria-label={`Story ${i + 1} location`}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={d.verdict > 0 ? "default" : "outline"}
                    onClick={() => update(i, { verdict: d.verdict === 1 ? 0 : 1 })}
                  >
                    Green flag
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={d.verdict < 0 ? "destructive" : "outline"}
                    onClick={() => update(i, { verdict: d.verdict === -1 ? 0 : -1 })}
                  >
                    Red flag
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {progress && (
          <p className="text-xs text-muted-foreground" role="status">
            Preparing images… {progress.done}/{progress.total}
          </p>
        )}

        <Button
          onClick={() => publish.mutate()}
          disabled={publish.isPending || readyCount === 0}
          className="w-full"
        >
          {publish.isPending
            ? "Publishing…"
            : `Publish ${readyCount} stor${readyCount === 1 ? "y" : "ies"} to the feed`}
        </Button>
      </CardContent>
    </Card>
  );
};

export default BulkSeedPanel;
