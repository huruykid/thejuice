import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const faqs = [
  {
    q: "What happened to TeaOnHer?",
    a: "TeaOnHer was removed from the Apple App Store in October 2025 over content moderation and privacy failures, after security researchers reported it was exposing users' driver's licenses, email addresses, and selfies. As of 2026 the app appears to be inactive.",
  },
  {
    q: "Is there a TeaOnHer alternative that still works?",
    a: "Yes — Juice (sipjuice.app) is an anonymous dating-review platform for verified men. It runs in your browser as a PWA, so there's no app store download to disappear. Every member passes a human-reviewed selfie verification before they can read or post.",
  },
  {
    q: "Is Juice safer than TeaOnHer was?",
    a: "TeaOnHer's downfall was security: leaked IDs and personal data. Juice never asks for your driver's license, your verification selfie is stored in a private bucket and can be deleted, your name is never shown on posts, and every table in the database is protected by row-level security. There is also a public dispute process so anyone can request removal of a post about them.",
  },
  {
    q: "Do I need to download Juice from the App Store?",
    a: "No. Juice works instantly in any mobile browser at sipjuice.app — add it to your home screen and it behaves like a native app. Nothing to install, nothing a store can take down.",
  },
  {
    q: "Can I still download the TeaOnHer app?",
    a: "No. TeaOnHer is no longer available on the Apple App Store, and the service itself appears to be shut down. Beware of copycat apps using the TeaOnHer name — several unofficial clones appeared after the removal. Juice is not affiliated with TeaOnHer; it's an independent platform built with verification and privacy first.",
  },
  {
    q: "Is Juice free?",
    a: "Yes. Joining, verification, searching, and posting are free.",
  },
];

const TeaOnHerAlternative = () => {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const differences = [
    {
      title: "Human-verified members, no ID uploads",
      body: "TeaOnHer leaked driver's licenses. Juice verifies you're a real man with a one-time selfie reviewed by a human — no government ID ever touches our servers, and you can delete the selfie afterward.",
    },
    {
      title: "Anonymous by design",
      body: "Your name never appears on anything you post. Sign-in is only for access — the community sees a codename, nothing else.",
    },
    {
      title: "Look her up before the date",
      body: "Search a first name and city and see what verified men actually experienced — one green or red flag plus the story.",
    },
    {
      title: "Real moderation and a public dispute process",
      body: "Every post can be reported, a moderation team reviews flagged content, and anyone — member or not — can request removal of a post about them. That accountability is why we're still here.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>TeaOnHer Alternative That Still Works (2026) | Juice</title>
        <meta
          name="description"
          content="TeaOnHer was pulled from the App Store and is now inactive. Juice is the verified, anonymous dating-review app for men — no download needed, works in your browser."
        />
        <link rel="canonical" href="https://sipjuice.app/teaonher-alternative" />
        <meta property="og:title" content="TeaOnHer Alternative That Still Works (2026) | Juice" />
        <meta
          property="og:description"
          content="TeaOnHer is gone. Juice is the verified, anonymous dating-review community for men — instant access in your browser, no app store required."
        />
        <meta property="og:url" content="https://sipjuice.app/teaonher-alternative" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://sipjuice.app/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="TeaOnHer Alternative That Still Works (2026) | Juice" />
        <meta name="twitter:description" content="TeaOnHer is gone. Juice is the verified, anonymous dating-review community for men — instant access in your browser." />
        <meta name="twitter:image" content="https://sipjuice.app/og-image.png" />
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      {/* Wire strip — masthead ticker instead of a floating pill badge */}
      <div className="border-y border-border">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-3 overflow-x-auto whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <span className="text-primary">Verified men only</span>
          <span aria-hidden className="text-border">·</span>
          <span>Anonymous to post</span>
          <span aria-hidden className="text-border">·</span>
          <span>No ID uploads</span>
        </div>
      </div>

      {/* Hero — type-led, left-aligned */}
      <section className="px-4 pt-14 pb-16 md:pt-20">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-display font-extrabold uppercase leading-[0.9] tracking-tight text-5xl md:text-6xl lg:text-7xl text-foreground mb-6 max-w-4xl">
            Looking for TeaOnHer? It's gone.{" "}
            <span className="text-primary">Juice is what's next.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl leading-relaxed">
            TeaOnHer was removed from the App Store in 2025 after repeated security leaks and is no
            longer active. Juice does what it promised — verified men, anonymous reviews, green and
            red flags — and it runs right in your browser. No download, nothing to take down.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <Button size="xl" variant="juice" asChild className="font-bold">
              <Link to="/app">Join Juice free <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button size="xl" variant="outline" asChild>
              <Link to="/how-it-works">How it works</Link>
            </Button>
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Free · Anonymous · We never ask for your ID
          </p>
        </div>
      </section>

      {/* What happened */}
      <section className="px-4 py-16 md:py-20 bg-secondary">
        <div className="max-w-6xl mx-auto">
          <div className="border-t-2 border-foreground pt-4 mb-10">
            <h2 className="font-display font-extrabold uppercase tracking-tight text-3xl md:text-4xl text-foreground">What happened to TeaOnHer?</h2>
          </div>
          <div className="max-w-3xl">
            <p className="text-lg text-muted-foreground mb-4 leading-relaxed">
              TeaOnHer launched in 2025 as the men's answer to the Tea app and hit millions of
              downloads in weeks. Then security researchers found it was exposing users' driver's
              licenses, email addresses, locations, and selfies. In October 2025, Apple removed both
              Tea and TeaOnHer from the App Store over privacy and moderation failures, and TeaOnHer
              never recovered — by 2026 it was inactive.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              The idea wasn't the problem. The execution was. Juice was built from day one around the
              two things TeaOnHer neglected: member privacy and real moderation. Curious how Juice
              stacks up against the original Tea app too? See the full{" "}
              <Link to="/tea-app-comparison" className="text-primary underline underline-offset-4">
                Juice vs. Tea app comparison
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Differences — numbered editorial index */}
      <section className="px-4 py-16 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="border-t-2 border-foreground pt-4 mb-10">
            <h2 className="font-display font-extrabold uppercase tracking-tight text-3xl md:text-4xl text-foreground">
              How Juice is different
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0 md:gap-y-2">
            {differences.map((d, index) => (
              <div key={d.title} className="border-t border-border py-6 flex gap-5">
                <span className="font-display font-extrabold text-2xl text-primary leading-none pt-0.5 w-10 shrink-0" aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-base font-bold text-foreground mb-1">{d.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{d.body}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <Button size="xl" variant="juice" asChild className="font-bold">
              <Link to="/app">Look someone up now <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ — ruled list, no boxes */}
      <section className="px-4 py-16 md:py-20 bg-secondary">
        <div className="max-w-6xl mx-auto">
          <div className="border-t-2 border-foreground pt-4 mb-8">
            <h2 className="font-display font-extrabold uppercase tracking-tight text-3xl md:text-4xl text-foreground">
              TeaOnHer questions, answered
            </h2>
          </div>
          <div className="divide-y divide-border border-b border-border max-w-3xl">
            {faqs.map((f) => (
              <div key={f.q} className="py-6">
                <h3 className="text-lg font-bold text-foreground mb-2">{f.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA — flat ink band */}
      <section className="bg-foreground text-background">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <h2 className="font-display font-extrabold uppercase tracking-tight leading-[0.95] text-4xl md:text-6xl mb-4 max-w-3xl">
            The Tea app for men — done right this time
          </h2>
          <p className="text-lg text-background/70 mb-8 max-w-xl">
            Free to join. Verification takes about a minute. Works on any phone, straight from the
            browser.
          </p>
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-background/70 mb-10">
            <span className="flex items-center gap-2 text-sm font-semibold"><Check className="h-4 w-4 text-primary" /> Every member human-verified</span>
            <span className="flex items-center gap-2 text-sm font-semibold"><Check className="h-4 w-4 text-primary" /> Anonymous to post</span>
            <span className="flex items-center gap-2 text-sm font-semibold"><Check className="h-4 w-4 text-primary" /> No download needed</span>
          </div>
          <Button size="xl" variant="juice" asChild className="font-bold w-fit">
            <Link to="/app">Get the Juice <ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default TeaOnHerAlternative;
