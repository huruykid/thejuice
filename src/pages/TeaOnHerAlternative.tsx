import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, ShieldCheck, ArrowRight, Search, EyeOff, Scale } from "lucide-react";
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
      icon: ShieldCheck,
      title: "Human-verified members, no ID uploads",
      body: "TeaOnHer leaked driver's licenses. Juice verifies you're a real man with a one-time selfie reviewed by a human — no government ID ever touches our servers, and you can delete the selfie afterward.",
    },
    {
      icon: EyeOff,
      title: "Anonymous by design",
      body: "Your name never appears on anything you post. Sign-in is only for access — the community sees a codename, nothing else.",
    },
    {
      icon: Search,
      title: "Look her up before the date",
      body: "Search a first name and city and see what verified men actually experienced — one green or red flag plus the story.",
    },
    {
      icon: Scale,
      title: "Real moderation and a public dispute process",
      body: "Every post can be reported, a moderation team reviews flagged content, and anyone — member or not — can request removal of a post about them. That accountability is why we're still here.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-soft">
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

      {/* Hero */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full mb-6">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified men only · Anonymous to post · No ID uploads
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Looking for TeaOnHer? It's gone. <span className="text-primary">Juice is what's next.</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            TeaOnHer was removed from the App Store in 2025 after repeated security leaks and is no
            longer active. Juice does what it promised — verified men, anonymous reviews, green and
            red flags — and it runs right in your browser. No download, nothing to take down.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-lg px-8">
              <Link to="/app">Join Juice free <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8">
              <Link to="/how-it-works">How it works</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Free · Anonymous · We never ask for your ID
          </p>
        </div>
      </section>

      {/* What happened */}
      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground mb-4 text-center">What happened to TeaOnHer?</h2>
          <p className="text-lg text-muted-foreground mb-4">
            TeaOnHer launched in 2025 as the men's answer to the Tea app and hit millions of
            downloads in weeks. Then security researchers found it was exposing users' driver's
            licenses, email addresses, locations, and selfies. In October 2025, Apple removed both
            Tea and TeaOnHer from the App Store over privacy and moderation failures, and TeaOnHer
            never recovered — by 2026 it was inactive.
          </p>
          <p className="text-lg text-muted-foreground">
            The idea wasn't the problem. The execution was. Juice was built from day one around the
            two things TeaOnHer neglected: member privacy and real moderation. Curious how Juice
            stacks up against the original Tea app too? See the full{" "}
            <Link to="/tea-app-comparison" className="text-primary underline underline-offset-4">
              Juice vs. Tea app comparison
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Differences */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground mb-10 text-center">
            How Juice is different
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {differences.map((d) => (
              <Card key={d.title} className="border-0 shadow-card bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <d.icon className="h-8 w-8 text-primary mb-3" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">{d.title}</h3>
                  <p className="text-muted-foreground">{d.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button size="lg" asChild className="text-lg px-8">
              <Link to="/app">Look someone up now <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground mb-10 text-center">
            TeaOnHer questions, answered
          </h2>
          <div className="space-y-6">
            {faqs.map((f) => (
              <Card key={f.q} className="border-0 shadow-card bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">{f.q}</h3>
                  <p className="text-muted-foreground">{f.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            The Tea app for men — done right this time
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Free to join. Verification takes about a minute. Works on any phone, straight from the
            browser.
          </p>
          <div className="flex flex-wrap gap-6 justify-center text-muted-foreground mb-8">
            <span className="flex items-center gap-2"><Check className="h-5 w-5 text-primary" /> Every member human-verified</span>
            <span className="flex items-center gap-2"><Check className="h-5 w-5 text-primary" /> Anonymous to post</span>
            <span className="flex items-center gap-2"><Check className="h-5 w-5 text-primary" /> No download needed</span>
          </div>
          <Button size="lg" asChild className="text-lg px-8">
            <Link to="/app">Get the Juice <ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default TeaOnHerAlternative;
