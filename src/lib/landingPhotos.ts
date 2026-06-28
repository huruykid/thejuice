import { supabase } from "@/integrations/supabase/client";

/** Public URL for an admin-uploaded landing/teaser example photo (1-based slot). */
export const landingPhotoUrl = (n: number) =>
  supabase.storage.from("landing-assets").getPublicUrl(`example-${n}.png`).data.publicUrl;
