import { supabase } from "@/integrations/supabase/client";

const BUCKET = "story-images";
export const SIGNED_URL_TTL_SECONDS = 3600; // 1 hour

/**
 * Micro-batching signer for the private story-images bucket.
 *
 * Every mounted card needs signed URLs, but one storage round-trip PER CARD made
 * feeds/grids feel slow (12+ requests per page). Requests made within the same
 * 10ms window are coalesced into a single createSignedUrls call; each caller
 * gets back exactly the URLs for its own paths. React-query still caches per
 * story on top of this, so the batch only pays out on fresh mounts.
 */
interface PendingRequest {
  paths: string[];
  resolve: (urls: string[]) => void;
  reject: (err: unknown) => void;
}

let pending: PendingRequest[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

const flush = async () => {
  const batch = pending;
  pending = [];
  timer = null;
  if (batch.length === 0) return;

  const allPaths = [...new Set(batch.flatMap((b) => b.paths))];
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrls(allPaths, SIGNED_URL_TTL_SECONDS);
    if (error) throw error;

    // Map results by path (fall back to request order, which the API preserves).
    const byPath = new Map<string, string>();
    (data ?? []).forEach((d, i) => {
      const key = d.path ?? allPaths[i];
      if (d.signedUrl) byPath.set(key, d.signedUrl);
    });

    batch.forEach((b) =>
      b.resolve(b.paths.map((p) => byPath.get(p)).filter((u): u is string => Boolean(u)))
    );
  } catch (err) {
    batch.forEach((b) => b.reject(err));
  }
};

/** Resolve storage paths to signed URLs, coalescing concurrent callers into one request. */
export function getSignedUrlsBatched(paths: string[]): Promise<string[]> {
  return new Promise((resolve, reject) => {
    pending.push({ paths, resolve, reject });
    if (!timer) timer = setTimeout(flush, 10);
  });
}
