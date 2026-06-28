import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { landingPhotoUrl } from "@/lib/landingPhotos";

const BUCKET = "landing-assets";
const SLOTS = [1, 2, 3, 4, 5];

/**
 * Admin tool: upload the example-card photos shown on the public landing page and the
 * unverified feed. Stored in the public `landing-assets` bucket (admin-write only).
 * The founder uploads his own images here.
 */
const LandingPhotosUploader = () => {
  const [busy, setBusy] = useState<number | null>(null);
  const [bust, setBust] = useState<Record<number, number>>({});

  const upload = async (n: number, file: File) => {
    setBusy(n);
    try {
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(`example-${n}.png`, file, { upsert: true, contentType: file.type || "image/png" });
      if (error) throw error;
      setBust((b) => ({ ...b, [n]: Date.now() }));
      toast.success(`Photo ${n} updated`);
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Landing photos</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-3">
          These appear in the example cards on the landing page and the unverified feed. Upload
          images you have the rights to use. Square images look best.
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {SLOTS.map((n) => (
            <div key={n} className="space-y-1">
              <div className="aspect-square w-full rounded-lg overflow-hidden bg-muted relative flex items-center justify-center">
                <span className="absolute text-[10px] text-muted-foreground/60">empty</span>
                <img
                  src={`${landingPhotoUrl(n)}${bust[n] ? `?t=${bust[n]}` : ""}`}
                  alt=""
                  className="relative w-full h-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }}
                />
                {busy === n && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}
              </div>
              <label className="flex items-center justify-center gap-1 text-[11px] text-primary font-medium cursor-pointer py-1 hover:underline">
                <Upload className="h-3 w-3" /> Photo {n}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={busy !== null}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(n, f); e.target.value = ""; }}
                />
              </label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default LandingPhotosUploader;
