// Shared email chrome for all customer-facing Juice emails. One source of truth for the
// brand lockup, type, colors, button, sign-off, and CAN-SPAM footer — so copy/branding
// changes happen in one place instead of being copy-pasted across every function.
// Mirrors the design tokens in src/index.css (amber primary, near-black text, Barlow).

export const BRAND = {
  font: `"Barlow",-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif`,
  amber: "#F8B23A",   // --primary
  ink: "#0A0A0A",     // --foreground / --primary-foreground
  muted: "#737373",   // --muted-foreground
  faint: "#9A9A9A",
  hairline: "#DBDBDB", // --border
  appUrl: "https://sipjuice.app",
  logo: "https://sipjuice.app/lovable-uploads/cf8e88b6-e6aa-4e2a-b0da-abdcf3e4641f.png",
};

export const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
   .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** Amber primary button. `label` may contain entities like &rarr;. */
export const button = (href: string, label: string) =>
  `<a href="${href}" style="background:${BRAND.amber};color:${BRAND.ink};text-decoration:none;padding:13px 26px;border-radius:8px;font-weight:600;display:inline-block">${label}</a>`;

/** "— Juice" sign-off line. */
export const signoff = () =>
  `<p style="font-size:13px;color:${BRAND.faint};margin:28px 0 0">&mdash; Juice</p>`;

/** CAN-SPAM footer: unsubscribe link + postal address. Marketing emails only. */
export const unsubFooter = (unsubUrl: string, companyAddress: string) =>
  `<hr style="border:none;border-top:1px solid ${BRAND.hairline};margin:24px 0 12px">
   <p style="font-size:12px;line-height:1.5;color:${BRAND.faint};margin:0">
     You're receiving this because you created a Juice account.
     <a href="${unsubUrl}" style="color:${BRAND.muted}">Unsubscribe</a>.<br>${companyAddress}
   </p>`;

/**
 * Wraps body HTML in the branded shell: Barlow @import, hidden preheader, the centered
 * logo + "The Juice App" wordmark lockup, then the body.
 */
export const emailShell = (opts: { preheader: string; body: string }) => `
  <style>@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700&display=swap');</style>
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${opts.preheader}</div>
  <div style="max-width:520px;margin:0 auto;font-family:${BRAND.font};color:${BRAND.ink};padding:32px 24px">
    <div style="text-align:center;margin:0 0 28px">
      <img src="${BRAND.logo}" alt="The Juice App" width="56" height="56" style="display:inline-block;border:0;margin:0 0 8px">
      <div style="font-family:${BRAND.font};font-size:22px;font-weight:700;letter-spacing:-0.01em;color:${BRAND.ink}">The <span style="color:${BRAND.amber}">Juice</span> App</div>
    </div>
    ${opts.body}
  </div>`;
