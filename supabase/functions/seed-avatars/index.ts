import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// One-off seeding helper: pulls synthetic cartoon avatars (DiceBear — clearly
// illustrations, not real or photorealistic people) and stores them in the
// story-images bucket for use on fictional seed stories. Gated by a shared secret.
// NOTE: secret is hardcoded to match the deployed version; relocate/rotate if this
// repo is public (see supabase/functions/selfie-sweep/index.ts).
const SECRET = 'swp_3xR9Kqz7Lm2Tn8Vb4Wd6Yc1Pf5Hg0Js';
const BUCKET = 'story-images';
const STYLES = ['lorelei', 'adventurer', 'notionists', 'micah', 'avataaars', 'personas'];

Deno.serve(async (req) => {
  if (req.headers.get('x-sweep-secret') !== SECRET) {
    return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }
  const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

  const results: any[] = [];
  for (let i = 1; i <= 12; i++) {
    const style = STYLES[i % STYLES.length];
    const src = `https://api.dicebear.com/9.x/${style}/png?seed=juice-seed-${i}&size=512`;
    try {
      const resp = await fetch(src);
      if (!resp.ok) { results.push({ i, ok: false, error: `fetch ${resp.status}` }); continue; }
      const bytes = new Uint8Array(await resp.arrayBuffer());
      const path = `seed/av${i}.png`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: 'image/png', upsert: true });
      results.push({ i, path, ok: !error, error: error?.message });
    } catch (e) {
      results.push({ i, ok: false, error: String(e) });
    }
  }
  return new Response(JSON.stringify({ results }), { headers: { 'Content-Type': 'application/json' } });
});
