import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import { Check, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

/* FAQ copy mirrors the exact phrasings searchers use ("tea app for men",
   "male version of tea", "tea app for guys") — this page earns impressions
   for that whole family, so questions and answers are written to match it. */
const faqs = [
  {
    q: "Is there a Tea app for men?",
    a: "Yes. Juice is the Tea app for men — verified men anonymously share reviews of the women they've dated, with green flags and red flags, exactly like Tea did for women. It's free and runs in your browser at sipjuice.app.",
  },
  {
    q: "What is the male version of the Tea app?",
    a: "Juice is the male version of the Tea app. Same concept flipped: a men-only, verified community where you can look up a woman by first name and city before a date and read what other men experienced.",
  },
  {
    q: "Can guys use the original Tea app?",
    a: "No — Tea was women-only, and it was removed from the Apple App Store in October 2025 over privacy and moderation failures. Men looking for the same thing use Juice, which was built for men from day one.",
  },
  {
    q: "Is the Tea app for men free?",
    a: "Yes. Juice is free — creating an account, verifying, searching names, and posting your own reviews all cost nothing.",
  },
  {
    q: "Do I need to download the Tea app for men from an app store?",
    a: "No download needed. Juice works instantly in any mobile browser at sipjuice.app — add it to your home screen and it behaves like a native app.",
  },
  {
    q: "How do I know the reviews are from real men?",
    a: "Every member passes a one-time, human-reviewed selfie verification before they can read or post. No government ID is ever required, and posts are published under anonymous codenames.",
  },
];

const TeaAppComparison = () => {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const comparisons = [
    {
      feature: "Target Audience",
      original: "Women sharing dating experiences",
      ours: "Men sharing dating experiences",
      oursBetter: true
    },
    {
      feature: "Verification System",
      original: "Limited verification",
      ours: "Mandatory selfie verification",
      oursBetter: true
    },
    {
      feature: "Community Focus",
      original: "Mixed gender discussions",
      ours: "Men-only safe space",
      oursBetter: true
    },
    {
      feature: "Story Categories",
      original: "General dating stories",
      ours: "Structured rating system (4 metrics)",
      oursBetter: true
    },
    {
      feature: "Anonymity",
      original: "Basic anonymity",
      ours: "Complete anonymity with verification",
      oursBetter: true
    },
    {
      feature: "Content Moderation",
      original: "Community-driven",
      ours: "Professional moderation + community",
      oursBetter: true
    },
    {
      feature: "Story Depth",
      original: "Free-form posts",
      ours: "Structured 4-metric rating per experience",
      oursBetter: true
    },
    {
      feature: "User Safety",
      original: "Basic safety measures",
      ours: "Enhanced verification + reporting",
      oursBetter: true
    }
  ];

  const advantages = [
    {
      title: "Male-Centric Design",
      description: "Built specifically for men's communication styles and dating concerns",
      benefit: "More relevant advice and experiences"
    },
    {
      title: "Structured Reviews",
      description: "Rate dates on emotional safety, communication, loyalty, and overall vibe",
      benefit: "Actionable insights instead of just stories"
    },
    {
      title: "Verified Community",
      description: "Every member is verified to ensure authentic experiences",
      benefit: "Higher quality content and trustworthy advice"
    },
    {
      title: "No Drama Zone",
      description: "Men-only environment eliminates cross-gender dating politics",
      benefit: "Honest discussions without judgment"
    }
  ];

  const stats = [
    {
      value: "4",
      label: "Rating Metrics",
      detail: "Every review covers communication, safety, vibe, and loyalty",
    },
    {
      value: "100%",
      label: "Manual Approval",
      detail: "Every member is reviewed before joining — no auto sign-ups",
    },
    {
      value: "24h",
      label: "Verification Time",
      detail: "Fast verification process to get you sharing quickly",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Tea App for Men — Juice Is the Male Version of Tea</title>
        <meta name="description" content="Yes, there's a Tea app for men. Juice is the male version of the Tea app: verified men anonymously review the women they've dated — green flags and red. Free, no download." />
        <link rel="canonical" href="https://sipjuice.app/tea-app-comparison" />
        <meta property="og:title" content="Tea App for Men — Juice Is the Male Version of Tea" />
        <meta property="og:description" content="Yes, there's a Tea app for men. Juice is the male version of the Tea app: verified men anonymously review the women they've dated — green flags and red. Free, no download." />
        <meta property="og:url" content="https://sipjuice.app/tea-app-comparison" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      {/* Hero Section */}
      <section className="px-4 pt-14 pb-16 md:pt-20">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-display font-extrabold uppercase leading-[0.9] tracking-tight text-5xl md:text-6xl lg:text-7xl text-foreground mb-6 max-w-4xl">
            Yes, there's a Tea app for men. <span className="text-primary">It's called Juice.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl leading-relaxed">
            Juice is the male version of the Tea app: verified men anonymously review the women
            they've dated — green flags and red — so you can look her up before the date.
            Here's how it compares to the original.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="xl" variant="juice" asChild className="font-bold">
              <Link to="/app">Join Juice free <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button size="xl" variant="outline" asChild>
              <Link to="/how-it-works">How it works</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="px-4 py-16 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="border-t-2 border-foreground pt-4 mb-10 flex items-baseline justify-between gap-4 flex-wrap">
            <h2 className="font-display font-extrabold uppercase tracking-tight text-3xl md:text-4xl text-foreground">
              Tea app vs. Juice — feature by feature
            </h2>
            <p className="text-sm text-muted-foreground">
              Why verified men prefer Juice
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-b border-border">
              <thead>
                <tr className="border-b-2 border-foreground">
                  <th className="text-left py-3 pr-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground">Feature</th>
                  <th className="text-left py-3 pr-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Tea App</th>
                  <th className="text-left py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Juice</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((comparison, index) => (
                  <tr key={index} className="border-t border-border first:border-t-0">
                    <td className="py-4 pr-4 font-medium text-foreground">{comparison.feature}</td>
                    <td className="py-4 pr-4 text-muted-foreground">{comparison.original}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-success shrink-0" />
                        <span className="text-foreground">{comparison.ours}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Advantages Section */}
      <section className="px-4 py-16 md:py-20 bg-secondary">
        <div className="max-w-6xl mx-auto">
          <div className="border-t-2 border-foreground pt-4 mb-10 flex items-baseline justify-between gap-4 flex-wrap">
            <h2 className="font-display font-extrabold uppercase tracking-tight text-3xl md:text-4xl text-foreground">
              What Only Juice Offers
            </h2>
            <p className="text-sm text-muted-foreground">
              What makes the difference
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0 md:gap-y-2">
            {advantages.map((advantage, index) => (
              <div key={index} className="border-t border-border py-6 flex gap-5">
                <span className="font-display font-extrabold text-2xl text-primary leading-none pt-0.5 w-10 shrink-0" aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-base font-bold text-foreground mb-1">{advantage.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    {advantage.description}
                  </p>
                  <p className="text-sm font-medium text-primary">
                    <strong>Benefit:</strong> {advantage.benefit}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="px-4 py-16 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="border-t-2 border-foreground pt-4 mb-10 flex items-baseline justify-between gap-4 flex-wrap">
            <h2 className="font-display font-extrabold uppercase tracking-tight text-3xl md:text-4xl text-foreground">
              By the Numbers
            </h2>
            <p className="text-sm text-muted-foreground">
              Operational specifics from how Juice is built
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="border-t border-border pt-5">
                <span className="font-display font-extrabold text-5xl text-primary leading-none block mb-3" aria-hidden>
                  {stat.value}
                </span>
                <h3 className="text-lg font-bold text-foreground mb-2">{stat.label}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{stat.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ — mirrors the "tea app for men / male version of tea" query family */}
      <section className="px-4 py-16 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="border-t-2 border-foreground pt-4 mb-8">
            <h2 className="font-display font-extrabold uppercase tracking-tight text-3xl md:text-4xl text-foreground">
              Tea app for men — your questions, answered
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
          <p className="text-sm text-muted-foreground mt-8 max-w-3xl leading-relaxed">
            Also looking at TeaOnHer? See the{" "}
            <Link to="/teaonher-alternative" className="text-primary underline underline-offset-4">
              TeaOnHer alternative that still works
            </Link>
            , read{" "}
            <Link to="/mens-dating-advice" className="text-primary underline underline-offset-4">
              dating advice from verified men
            </Link>
            , or browse{" "}
            <Link to="/anonymous-dating-reviews" className="text-primary underline underline-offset-4">
              anonymous dating reviews
            </Link>{" "}
            and the{" "}
            <Link to="/blog" className="text-primary underline underline-offset-4">
              Juice blog
            </Link>
            .
          </p>
        </div>
      </section>

      {/* CTA Section — flat ink band */}
      <section className="bg-foreground text-background">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <h2 className="font-display font-extrabold uppercase tracking-tight leading-[0.95] text-4xl md:text-6xl mb-4 max-w-3xl">
            One platform, built for how men actually date.
          </h2>
          <p className="text-lg text-background/70 mb-10 max-w-xl">
            Verified members. Anonymous stories. No drama from the other side of the equation.
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <Button size="xl" variant="juice" asChild className="font-bold w-fit">
              <Link to="/app">
                Join free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <p className="text-sm text-background/60 uppercase tracking-[0.18em] font-semibold">
              Free to join • Verified community • Anonymous sharing
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TeaAppComparison;
