import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Internal cleanup utility. Deletes every verification-selfie whose owner is no
// longer pending (approved or rejected) — so member verification photos never
// linger after they've served their one purpose. Triggered once on demand and
// daily by the `daily-selfie-sweep` pg_cron job.
//
// Auth: gated by a shared secret header (verify_jwt is off so the DB cron can call
// it). NOTE: the secret is currently hardcoded to match the deployed version; for
// better hygiene move it to a Supabase secret (Deno.env.get('SELFIE_SWEEP_SECRET'))
// and rotate this value, especially if this repo is public.
const SWEEP_SECRET = 'swp_3xR9Kqz7Lm2Tn8Vb4Wd6Yc1Pf5Hg0Js';
const BUCKET = 'verification-selfies';

Deno.serve(async (req) => {
  if (req.headers.get('x-sweep-secret') !== SWEEP_SECRET) {
    return new Response(JSON.stringify({ error: 'forbidden' }), {
      status: 403, headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  // Exact object paths to delete (owner not pending).
  const { data: rows, error: rpcErr } = await supabase.rpc('processed_selfie_object_names');
  if (rpcErr) {
    return new Response(JSON.stringify({ error: rpcErr.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  const paths: string[] = (Array.isArray(rows) ? rows : [])
    .map((r: any) => (typeof r === 'string' ? r : (r?.processed_selfie_object_names ?? r?.name ?? Object.values(r ?? {})[0])))
    .filter((p: any): p is string => typeof p === 'string' && p.length > 0);

  let removed = 0;
  const errors: string[] = [];
  for (let i = 0; i < paths.length; i += 100) {
    const chunk = paths.slice(i, i + 100);
    const { data: rm, error: rmErr } = await supabase.storage.from(BUCKET).remove(chunk);
    if (rmErr) errors.push(rmErr.message);
    else removed += Array.isArray(rm) ? rm.length : 0;
  }

  // Clear DB pointers for processed verifications that still reference a selfie.
  await supabase
    .from('user_verifications')
    .update({ selfie_url: null, selfie_deleted_at: new Date().toISOString() })
    .neq('verification_status', 'pending')
    .not('selfie_url', 'is', null);

  return new Response(JSON.stringify({ requested: paths.length, removed, errors }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
