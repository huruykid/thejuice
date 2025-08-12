import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const Support = () => {
  useEffect(() => {
    const prevTitle = document.title;
    const description = "Support for The Juice App: contact support@sipjuice.app and find help resources.";

    document.title = "Support | The Juice App";

    let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", description);

    let linkCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!linkCanonical) {
      linkCanonical = document.createElement("link");
      linkCanonical.setAttribute("rel", "canonical");
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute("href", `${window.location.origin}/support`);

    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ContactPage",
      name: "Support | The Juice App",
      url: `${window.location.origin}/support`,
      publisher: {
        "@type": "Organization",
        name: "The Juice App",
        url: window.location.origin,
      },
      contactPoint: [{
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "support@sipjuice.app",
        availableLanguage: ["English"]
      }]
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
          <h1 className="text-3xl font-semibold tracking-tight">Support</h1>
          <p className="text-muted-foreground mt-2">We’re here to help. Reach out anytime.</p>
        </header>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-medium">Contact Us</h2>
            <p className="text-muted-foreground mt-1">
              Email our support team at
              {" "}
              <a className="underline underline-offset-4 story-link" href="mailto:support@sipjuice.app">support@sipjuice.app</a>.
            </p>
            <Button asChild variant="juice" className="mt-3">
              <a href="mailto:support@sipjuice.app">Email Support</a>
            </Button>
          </div>

          <div className="pt-4">
            <h2 className="text-lg font-medium">Common Topics</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
              <li>Account & verification help</li>
              <li>Reporting content or users</li>
              <li>Privacy & data requests</li>
            </ul>
          </div>

          <div className="pt-4">
            <h2 className="text-lg font-medium">Privacy & Safety</h2>
            <p className="text-muted-foreground mt-1">
              Read our
              {" "}
              <a className="underline underline-offset-4" href="/privacy-policy">Privacy Policy</a>
              {" "}
              to understand what we collect and how we use it.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
};

export default Support;
