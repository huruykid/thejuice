import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useConfirm } from "@/components/ConfirmDialog";
import { toast } from "sonner";

interface SeedStory {
  id: string;
  content: string;
  subject_name: string | null;
  location: string | null;
  overall_vibe_rating: number | null;
  created_at: string;
}

const RATINGS = [
  { key: "communication", label: "Communication" },
  { key: "loyalty", label: "Loyalty" },
  { key: "vibe", label: "Vibe" },
  { key: "emotional_safety", label: "Respect" },
] as const;

/**
 * Founder seeding tool. Drops curated, anonymized stories straight into the feed (is_seed,
 * approved) while real supply ramps. All writes go through admin-gated RPCs.
 */
const AdminSeed = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole(user?.id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { confirm, confirmDialog } = useConfirm();

  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("");
  const [location, setLocation] = useState("");
  const [ratings, setRatings] = useState<Record<string, number>>({
    communication: 4, loyalty: 4, vibe: 4, emotional_safety: 4,
  });

  useEffect(() => {
    if (!authLoading && !roleLoading && user && !isAdmin) navigate("/app");
  }, [authLoading, roleLoading, user, isAdmin, navigate]);

  const { data: seeds, isLoading } = useQuery({
    queryKey: ["admin-seed-stories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stories")
        .select("id, content, subject_name, location, overall_vibe_rating, created_at")
        .eq("is_seed", true)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as SeedStory[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase.rpc as any)("admin_create_seed_story", {
        p_content: content,
        p_subject_name: subject || null,
        p_location: location || null,
        p_communication: ratings.communication,
        p_loyalty: ratings.loyalty,
        p_vibe: ratings.vibe,
        p_emotional_safety: ratings.emotional_safety,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Story added to the feed");
      setContent(""); setSubject(""); setLocation("");
      queryClient.invalidateQueries({ queryKey: ["admin-seed-stories"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to add story"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.rpc as any)("admin_delete_seed_story", { p_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Seed story deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-seed-stories"] });
    },
    onError: (e: any) => toast.error(e?.message || "Delete failed"),
  });

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading…</p></div>;
  if (!user || !isAdmin) return null;

  return (
    <div className="bg-gradient-soft p-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <AdminPageHeader
          title="Seed stories"
          subtitle="Drop curated stories into the feed while real ones ramp up. Keep them anonymized — never name a real, identifiable person."
        />

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Add a story</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="s-content">Story</Label>
              <Textarea
                id="s-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                placeholder="What happened…"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="s-subject">About (optional)</Label>
                <Input id="s-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Hinge Hana" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-location">Location</Label>
                <Input id="s-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Austin, TX" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {RATINGS.map((r) => (
                <div key={r.key} className="space-y-1.5">
                  <Label className="text-xs">{r.label}</Label>
                  <Select
                    value={String(ratings[r.key])}
                    onValueChange={(v) => setRatings((p) => ({ ...p, [r.key]: Number(v) }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <Button
              onClick={() => create.mutate()}
              disabled={create.isPending || !content.trim()}
              className="w-full"
            >
              {create.isPending ? "Adding…" : "Add to feed"}
            </Button>
          </CardContent>
        </Card>

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2 px-1">
            Seed stories {seeds ? `(${seeds.length})` : ""}
          </h3>
          {isLoading ? (
            <p className="text-sm text-muted-foreground px-1">Loading…</p>
          ) : (
            <div className="space-y-2">
              {(seeds ?? []).map((s) => (
                <Card key={s.id}>
                  <CardContent className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm text-foreground line-clamp-2">{s.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {s.subject_name ? `${s.subject_name} · ` : ""}{s.location ?? "—"}
                          {s.overall_vibe_rating != null ? ` · vibe ${s.overall_vibe_rating}/5` : ""}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                        onClick={async () => { if (await confirm({ title: "Delete this seed story?", description: "This removes the seed story from the feed.", destructive: true, confirmLabel: "Delete" })) remove.mutate(s.id); }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(seeds ?? []).length === 0 && (
                <Card><CardContent className="text-center py-8 text-muted-foreground text-sm">No seed stories yet.</CardContent></Card>
              )}
            </div>
          )}
        </div>
        {confirmDialog}
      </div>
    </div>
  );
};

export default AdminSeed;
