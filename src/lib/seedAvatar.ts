/**
 * Images for seed stories.
 *
 * The feed is image-gated: Home and Explore both filter `.not('image_url','is',null)`
 * (src/hooks/useStories.ts) because photos are required on real posts — a photo is how
 * other guys recognize who a story is about. So a seed story with no image inserts fine
 * and then never appears. Every seeded story needs an image.
 *
 * Seed stories are fictional, so they can't carry a real person's photo. We reuse the
 * choice the `seed-avatars` edge function already made: DiceBear illustrations, which are
 * unmistakably drawings rather than photorealistic people. If DiceBear is unreachable we
 * fall back to a locally-drawn geometric tile so seeding never hard-fails on network.
 */

/** DiceBear styles, matching supabase/functions/seed-avatars/index.ts. */
const STYLES = ["lorelei", "adventurer", "notionists", "micah", "avataaars", "personas"] as const;

/** Flat two-tone palettes for the offline fallback tile. */
const PALETTES: Array<[string, string]> = [
  ["#1c1917", "#f5b700"],
  ["#0f172a", "#38bdf8"],
  ["#1a2e05", "#a3e635"],
  ["#2e1065", "#c4b5fd"],
  ["#450a0a", "#fca5a5"],
  ["#172554", "#fdba74"],
];

/**
 * Deterministic 32-bit hash (FNV-1a). Same seed always yields the same avatar, so
 * re-running a seed batch doesn't reshuffle every image.
 */
export function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** The DiceBear URL for a given seed. Exported for testing. */
export function dicebearUrl(seed: string, size = 512): string {
  const style = STYLES[hashSeed(seed) % STYLES.length];
  return `https://api.dicebear.com/9.x/${style}/png?seed=${encodeURIComponent(seed)}&size=${size}`;
}

/**
 * Draw a flat symmetric tile from the seed hash. Pure canvas, no network — this is the
 * fallback when DiceBear can't be reached.
 */
export function drawFallbackTile(seed: string, size = 512): Promise<Blob> {
  const hash = hashSeed(seed);
  const [bg, fg] = PALETTES[hash % PALETTES.length];

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("canvas unavailable"));

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  // 5x5 grid, mirrored across the vertical axis so the result reads as deliberate
  // rather than as noise. Only the left 3 columns are decided by the hash.
  const cells = 5;
  const cell = size / cells;
  ctx.fillStyle = fg;
  for (let col = 0; col < Math.ceil(cells / 2); col++) {
    for (let row = 0; row < cells; row++) {
      const bit = (hash >>> ((col * cells + row) % 32)) & 1;
      if (!bit) continue;
      ctx.fillRect(col * cell, row * cell, cell, cell);
      ctx.fillRect((cells - 1 - col) * cell, row * cell, cell, cell);
    }
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/png"
    );
  });
}

/**
 * Get an image for a seed story: DiceBear illustration, falling back to a local tile.
 */
export async function generateSeedImage(seed: string, size = 512): Promise<Blob> {
  try {
    const resp = await fetch(dicebearUrl(seed, size));
    if (resp.ok) {
      const blob = await resp.blob();
      if (blob.size > 0) return blob;
    }
  } catch {
    // fall through to the offline tile
  }
  return drawFallbackTile(seed, size);
}
