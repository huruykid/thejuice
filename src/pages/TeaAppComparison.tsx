import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

  return (
    <div className="min-h-screen bg-gradient-soft">
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
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Yes, there's a Tea app for men. <span className="text-primary">It's called Juice.</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Juice is the male version of the Tea app: verified men anonymously review the women
            they've dated — green flags and red — so you can look her up before the date.
            Here's how it compares to the original.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-lg px-8">
              <Link to="/app">Join Juice free <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8">
              <Link to="/how-it-works">How it works</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Tea app vs. Juice — feature by feature
            </h2>
            <p className="text-xl text-muted-foreground">
              Why verified men prefer Juice
            </p>
          </div>

          <Card className="border-0 shadow-card bg-white/80 backdrop-blur-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-primary/10">
                    <th className="text-left p-4 font-semibold text-foreground">Feature</th>
                    <th className="text-left p-4 font-semibold text-muted-foreground">Tea App</th>
                    <th className="text-left p-4 font-semibold text-primary">Juice</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisons.map((comparison, index) => (
                    <tr key={index} className="border-b border-primary/5 hover:bg-primary/5 transition-colors">
                      <td className="p-4 font-medium text-foreground">{comparison.feature}</td>
                      <td className="p-4 text-muted-foreground">{comparison.original}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-success" />
                          <span className="text-foreground">{comparison.ours}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </section>

      {/* Advantages Section */}
      <section className="py-16 px-4 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              What Only Juice Offers
            </h2>
            <p className="text-xl text-muted-foreground">
              What makes the difference
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {advantages.map((advantage, index) => (
              <Card key={index} className="border-0 shadow-card bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    {advantage.title}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {advantage.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-primary/10 p-4 rounded-lg">
                    <p className="text-sm font-medium text-primary">
                      <strong>Benefit:</strong> {advantage.benefit}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              By the Numbers
            </h2>
            <p className="text-xl text-muted-foreground">
              Operational specifics from how Juice is built
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center border-0 shadow-card bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="text-4xl font-bold text-primary mb-2">4</div>
                <div className="text-lg font-semibold text-foreground mb-2">Rating Metrics</div>
                <div className="text-sm text-muted-foreground">Every review covers communication, safety, vibe, and loyalty</div>
              </CardContent>
            </Card>
            
            <Card className="text-center border-0 shadow-card bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="text-4xl font-bold text-primary mb-2">100%</div>
                <div className="text-lg font-semibold text-foreground mb-2">Manual Approval</div>
                <div className="text-sm text-muted-foreground">Every member is reviewed before joining — no auto sign-ups</div>
              </CardContent>
            </Card>
            
            <Card className="text-center border-0 shadow-card bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="text-4xl font-bold text-primary mb-2">24h</div>
                <div className="text-lg font-semibold text-foreground mb-2">Verification Time</div>
                <div className="text-sm text-muted-foreground">Fast verification process to get you sharing quickly</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ — mirrors the "tea app for men / male version of tea" query family */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-10 text-center">
            Tea app for men — your questions, answered
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
          <p className="text-muted-foreground mt-8 text-center">
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

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="border-0 shadow-card bg-gradient-primary text-primary-foreground">
            <CardContent className="p-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                One platform, built for how men actually date.
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Verified members. Anonymous stories. No drama from the other side of the equation.
              </p>
              <Button size="lg" variant="secondary" asChild className="text-lg px-8">
                <Link to="/app">
                  Join free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <p className="text-sm mt-4 opacity-75">
                Free to join • Verified community • Anonymous sharing
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default TeaAppComparison;