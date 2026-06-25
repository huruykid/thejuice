import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "story-images";
const SIGNED_URL_TTL_SECONDS = 3600; // 1 hour

/**
 * Parse the `image_url` column. Stories store it as a JSON array (e.g.
 * `["uid/file1.jpg","uid/file2.jpg"]`). Older rows may contain full public URLs
 * instead of paths; both are handled.
 */
export function parseStoryImageField(image_url: string | null | undefined): string[] {
  if (!image_url) return [];
  try {
    const parsed = JSON.parse(image_url);
    if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String);
    if (parsed) return [String(parsed)];
    return [];
  } catch {
    // Not JSON — treat the raw value as a single entry.
    return [image_url];
  }
}

/**
 * Normalize a stored value to a storage object path. New rows store the path
 * directly; legacy rows store a full public URL like
 * `https://<proj>.supabase.co/storage/v1/object/public/story-images/<uid>/<file>`.
 */
function toObjectPath(value: string): string {
  const marker = `/${BUCKET}/`;
  const idx = value.indexOf(marker);
  if (idx !== -1) return value.slice(idx + marker.length);
  return value; // already a path
}

/**
 * Resolve a story's `image_url` field to short-lived signed URLs for the now-private
 * `story-images` bucket. Only verified/authenticated users can sign these (enforced
 * by the bucket SELECT policy). Batched into a single createSignedUrls call.
 */
export function useStoryImageUrls(image_url: string | null | undefined) {
  const paths = parseStoryImageField(image_url).map(toObjectPath);

  return useQuery({
    queryKey: ["story-image-signed", paths],
    enabled: paths.length > 0,
    // Refresh comfortably before the 1h signed URLs expire.
    staleTime: (SIGNED_URL_TTL_SECONDS - 300) * 1000,
    gcTime: SIGNED_URL_TTL_SECONDS * 1000,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
      if (error) throw error;
      return (data ?? [])
        .map((d) => d.signedUrl)
        .filter((u): u is string => Boolean(u));
    },
  });
}
