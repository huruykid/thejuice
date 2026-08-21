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
import { Trash2, ImagePlus, X } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import LandingPhotosUploader from "@/components/admin/LandingPhotosUploader";
import BulkSeedPanel from "@/components/admin/BulkSeedPanel";
import { useConfirm } from "@/components/ConfirmDialog";
import { toast } from "sonner";

interface SeedStory {
  id: string;
  content: string;
  subject_name: string | null;
  location: string | null;
  overall_vibe_rating: number | null;
  author_alias: string | null;
  created_at: string;
}

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
  const [verdict, setVerdict] = useState<number>(0); // 1 = green flag, -1 = red flag, 0 = none
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImage(null);
    setImagePreview("");
  };

  useEffect(() => {
    if (!authLoading && !roleLoading && user && !isAdmin) navigate("/app");
  }, [authLoading, roleLoading, user, isAdmin, navigate]);

  const { data: seeds, isLoading } = useQuery({
    queryKey: ["admin-seed-stories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stories")
        .select("id, content, subject_name, location, overall_vibe_rating, author_alias, created_at")
        .eq("is_seed", true)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as SeedStory[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      // Optional image: upload to the private story-images bucket under the admin's own folder
      // (the RLS path that works), then pass it to the RPC in the same JSON-array shape the
      // normal post flow uses, so the feed renders it via the existing signed-URL hook.
      let imageUrlParam: string | null = null;
      if (image) {
        if (!user) throw new Error("Not signed in");
        const ext = (image.name.split(".").pop() || "png").toLowerCase();
        const path = `${user.id}/seed-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("story-images").upload(path, image);
        if (upErr) throw upErr;
        imageUrlParam = JSON.stringify([path]);
      }
      const { error } = await supabase.rpc("admin_create_seed_story", {
        p_content: content,
        p_subject_name: subject || null,
        p_location: location || null,
        p_communication: 0,
        p_loyalty: 0,
        p_vibe: verdict,
        p_emotional_safety: 0,
        p_image_url: imageUrlParam,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Story added to the feed");
      setContent(""); setSubject(""); setLocation(""); setVerdict(0);
      clearImage();
      queryClient.invalidateQueries({ queryKey: ["admin-seed-stories"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to add story"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("admin_delete_seed_story", { p_id: id });
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
    <div className="bg-background p-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <AdminPageHeader
          title="Seed stories"
          subtitle="Drop curated stories into the feed while real ones ramp up. Keep them anonymized — never name a real, identifiable person."
        />

        <LandingPhotosUploader />

        <BulkSeedPanel />

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
            <div className="space-y-1.5">
              <Label className="text-xs">Verdict (optional)</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={verdict > 0 ? "default" : "outline"}
                  onClick={() => setVerdict(verdict === 1 ? 0 : 1)}
                >
                  Green flag
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={verdict < 0 ? "destructive" : "outline"}
                  onClick={() => setVerdict(verdict === -1 ? 0 : -1)}
                >
                  Red flag
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Image (optional)</Label>
              {imagePreview ? (
                <div className="relative w-24 h-24">
                  <img
                    src={imagePreview}
                    alt="Selected"
                    className="w-24 h-24 object-cover rounded-lg border border-border"
                  />
                  <button
                    type="button"
                    onClick={clearImage}
                    aria-label="Remove image"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <label className="inline-flex items-center gap-2 text-sm text-primary font-medium cursor-pointer hover:underline">
                  <ImagePlus className="h-4 w-4" /> Add image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        clearImage();
                        setImage(f);
                        setImagePreview(URL.createObjectURL(f));
                      }
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
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
                          {s.author_alias ? `@${s.author_alias} · ` : ""}
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
