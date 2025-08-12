import { useEffect } from "react";

const PrivacyPolicy = () => {
  useEffect(() => {
    const prevTitle = document.title;
    const description = "Privacy Policy for The Juice App: what we collect, how we use it, and your choices.";

    // Set Title
    document.title = "Privacy Policy | The Juice App";

    // Set/Update Meta Description
    let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", description);

    // Set/Update Canonical
    let linkCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!linkCanonical) {
      linkCanonical = document.createElement("link");
      linkCanonical.setAttribute("rel", "canonical");
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute("href", `${window.location.origin}/privacy-policy`);

    // JSON-LD structured data
    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Privacy Policy | The Juice App",
      url: `${window.location.origin}/privacy-policy`,
      isPartOf: {
        "@type": "Organization",
        name: "The Juice App",
        url: window.location.origin,
      },
    });
    document.head.appendChild(ld);

    return () => {
      document.title = prevTitle;
      document.head.removeChild(ld);
    };
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="max-w-3xl mx-auto px-6 py-10">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy for The Juice App</h1>
          <p className="text-muted-foreground mt-2">Effective Date: 08/12/2025</p>
        </header>

        <p className="text-muted-foreground mb-6">
          The Juice App is an anonymous, men-only social platform for sharing stories, comments, and advice—without judgment. This policy explains in plain English how we handle your information.
        </p>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Information We Collect</h2>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Account info: username and email to create and manage your account.</li>
            <li>Content you create: stories, comments, and reactions with basic timestamps/tags.</li>
            <li>Device info: device model, OS/app version, and basic diagnostics to keep the app working.</li>
          </ul>
          <p className="text-muted-foreground">We collect only what’s needed. We do not sell your data and we do not use third‑party ad SDKs or track you across other apps or websites.</p>
        </section>

        <section className="space-y-3 mt-6">
          <h2 className="text-lg font-medium">How We Use Your Information</h2>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Operate the app: accounts, posting, interactions, and relevant content.</li>
            <li>Safety and moderation: maintain standards and prevent abuse or fraud.</li>
            <li>Improve reliability: fix bugs, measure performance, and ship updates.</li>
            <li>Communicate with you: essential service messages (e.g., security, account changes).</li>
          </ul>
        </section>

        <section className="space-y-3 mt-6">
          <h2 className="text-lg font-medium">Sharing Your Information</h2>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Service providers: trusted vendors (hosting, database, email) to operate the app.</li>
            <li>Legal and safety: if required by law or necessary to protect users or the platform.</li>
          </ul>
          <p className="text-muted-foreground">We do not sell personal data or share it for advertising or cross‑app tracking.</p>
        </section>

        <section className="space-y-3 mt-6">
          <h2 className="text-lg font-medium">Data Security</h2>
          <p className="text-muted-foreground">We use safeguards like encryption in transit, access controls, and monitoring. No method is 100% secure, but we work to protect your information and limit what we collect. We keep data only as long as needed for the purposes above or as required by law.</p>
        </section>

        <section className="space-y-3 mt-6">
          <h2 className="text-lg font-medium">Your Choices</h2>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Request access, updates, or deletion of your data.</li>
            <li>Opt out of non‑essential emails.</li>
            <li>Stay anonymous by avoiding personal details in posts or comments.</li>
          </ul>
        </section>

        <section className="space-y-3 mt-6">
          <h2 className="text-lg font-medium">Changes to This Policy</h2>
          <p className="text-muted-foreground">We may update this policy. We’ll revise the “Effective Date” above and notify you in the app or by email when changes are significant.</p>
        </section>

        <section className="space-y-3 mt-6">
          <h2 className="text-lg font-medium">Contact Us</h2>
          <p className="text-muted-foreground">Email: <a className="underline underline-offset-4 hover-scale" href="mailto:support@sipjuice.app">support@sipjuice.app</a></p>
        </section>
      </section>
    </main>
  );
};

export default PrivacyPolicy;
