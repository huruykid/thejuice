/**
 * Leaked-password check via the HaveIBeenPwned range API (k-anonymity).
 *
 * Only the first 5 hex characters of the password's SHA-1 hash ever leave the
 * device; the API returns every known suffix for that prefix and the match
 * happens locally. This is the client-side stand-in for Supabase's Pro-plan
 * "leaked password protection" toggle — same data source, enforced in the
 * form instead of at the auth server, so it protects members from picking
 * breached passwords but does not stop direct API calls to the auth endpoint.
 *
 * Fails OPEN: if HIBP is unreachable or slow, account creation proceeds.
 * A best-effort breach check must never take signup down with it.
 */
export async function isPasswordLeaked(password: string): Promise<boolean> {
  try {
    const digest = await crypto.subtle.digest(
      "SHA-1",
      new TextEncoder().encode(password)
    );
    const hex = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
    const prefix = hex.slice(0, 5);
    const suffix = hex.slice(5);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    let res: Response;
    try {
      res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
        // Padding makes every response the same shape so the prefix can't be
        // correlated with result size on the wire.
        headers: { "Add-Padding": "true" },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
    if (!res.ok) return false;

    const body = await res.text();
    for (const line of body.split("\n")) {
      const [candidate, count] = line.trim().split(":");
      // Padded entries come back with count 0 — those are not real matches.
      if (candidate === suffix && parseInt(count, 10) > 0) return true;
    }
    return false;
  } catch {
    return false;
  }
}
