import { useEffect } from "react";

/**
 * Terms of Use + Community Guidelines + Acceptable Use Policy.
 *
 * NOTE FOR THE TEAM: this is a plain-English, good-faith policy that sets real,
 * enforceable rules and is far better than nothing — but the binding contract terms
 * (arbitration, class-action waiver, limitation of liability, indemnification, governing
 * law) should be reviewed/finalized by a licensed attorney before you rely on them in a
 * dispute. The Community Guidelines / Acceptable Use sections below are product policy and
 * are accurate to how Juice operates.
 */
const Terms = () => {
  useEffect(() => {
    document.title = "Terms & Community Guidelines | Juice";
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", "Juice Terms of Use, Community Guidelines, and Acceptable Use Policy.");
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", `${window.location.origin}/terms`);
  }, []);

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto prose prose-neutral">
        <h1 className="text-3xl font-bold text-foreground mb-1">Terms &amp; Community Guidelines</h1>
        <p className="text-sm text-muted-foreground mb-8">Effective date: 06/25/2026</p>

        <h2 className="text-xl font-semibold text-foreground mt-8 mb-2">1. Who can use Juice</h2>
        <p className="text-muted-foreground mb-4">
          Juice is for verified men aged 18 or older. By creating an account you confirm you are
          at least 18. We may ask you to verify you are a real person. Accounts found to belong to
          minors are removed.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8 mb-2">2. What Juice is</h2>
        <p className="text-muted-foreground mb-4">
          Juice is a community where verified members anonymously share their own real dating
          experiences. You post under a codename; your real identity is not shown to other members.
          Content reflects the personal experiences and opinions of members, not of Juice.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8 mb-2">3. Community Guidelines &amp; Acceptable Use</h2>
        <p className="text-muted-foreground mb-2">To keep this community safe and lawful, you agree NOT to post:</p>
        <ul className="text-muted-foreground mb-4 list-disc pl-6 space-y-1">
          <li>Anything about a person under 18, in any context.</li>
          <li>Contact information — phone numbers, addresses, workplaces, social handles, or other details that could be used to locate or harass someone (no doxxing).</li>
          <li>Threats, calls for violence, or content that harasses, stalks, or intimidates.</li>
          <li>Sexual content about an identifiable real person, or any intimate or explicit images of someone shared without their consent.</li>
          <li>Statements you know to be false, fabricated, or that you cannot personally stand behind.</li>
          <li>Posts about people you have not personally interacted with or dated.</li>
          <li>Content that is hateful or discriminatory, spam, scams, or impersonation.</li>
        </ul>
        <p className="text-muted-foreground mb-4">
          Post only your own honest, first-hand experience. Keep it to what happened, not unverified
          rumor. You are responsible for what you post.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8 mb-2">4. Anonymity is not immunity</h2>
        <p className="text-muted-foreground mb-4">
          Your codename keeps you anonymous to other members, but you remain responsible for your
          posts. We keep internal records and will act on violations, and may disclose information
          where required by law.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8 mb-2">5. If you're featured in a post</h2>
        <p className="text-muted-foreground mb-4">
          Anyone can request removal of a post about them — no account needed — through our{" "}
          <a href="/dispute" className="text-primary underline">removal request</a> form. We
          review every request and remove content that violates these rules or the law.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8 mb-2">6. Moderation &amp; enforcement</h2>
        <p className="text-muted-foreground mb-4">
          We review reports and removal requests and aim to act on serious reports quickly. We may
          remove content and warn, suspend, or ban accounts that break these rules. Illegal content
          (including any content sexualizing minors) is removed immediately and reported to the
          appropriate authorities.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8 mb-2">7. Your content</h2>
        <p className="text-muted-foreground mb-4">
          You keep ownership of what you post. You grant Juice a license to host and display it
          within the service. You confirm you have the right to share what you post and that it
          does not break these rules or anyone's legal rights.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8 mb-2">8. Disclaimers &amp; limits</h2>
        <p className="text-muted-foreground mb-4">
          Juice is provided "as is." Member content is not verified by us and should not be treated
          as fact. To the fullest extent permitted by law, Juice is not liable for content posted by
          members or for your use of the service.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8 mb-2">9. Changes &amp; contact</h2>
        <p className="text-muted-foreground mb-4">
          We may update these terms; we'll revise the date above and notify you of significant
          changes. Questions or reports:{" "}
          <a href="mailto:support@sipjuice.app" className="text-primary underline">support@sipjuice.app</a>.
        </p>

        <p className="text-xs text-muted-foreground mt-8">
          See also our{" "}
          <a href="/privacy-policy" className="text-primary underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
};

export default Terms;
