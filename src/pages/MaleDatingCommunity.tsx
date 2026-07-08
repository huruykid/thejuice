import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import { ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";

const MaleDatingCommunity = () => {
  const communityFeatures = [
    {
      title: "Anonymous Sharing",
      description: "Share your dating experiences without revealing your identity",
      benefits: ["Complete privacy", "No judgment", "Safe environment", "Real conversations"]
    },
    {
      title: "Verified Men Only",
      description: "Community exclusively for verified male members",
      benefits: ["Authentic stories", "Real experiences", "Trusted community", "No fake profiles"]
    },
    {
      title: "Global Community",
      description: "Connect with men from around the world sharing similar experiences",
      benefits: ["Diverse perspectives", "Cultural insights", "Worldwide support", "24/7 activity"]
    },
    {
      title: "Supportive Environment",
      description: "A judgment-free zone where men support each other",
      benefits: ["No toxic masculinity", "Emotional support", "Constructive advice", "Real community"]
    }
  ];

  const communityStats = [
    { number: "Verified", label: "Members Only", description: "Manual approval keeps it real" },
    { number: "Anonymous", label: "By Default", description: "Identity stays hidden, always" },
    { number: "24/7", label: "Community Activity", description: "Stories and discussions any time" },
    { number: "Zero", label: "Public Profiles", description: "Nothing about you is searchable" }
  ];

  const whatMenShare = [
    "First date experiences and advice",
    "Dating app success and failure stories",
    "Relationship lessons learned",
    "Red flags and warning signs",
    "Confidence building tips",
    "Communication strategies that work"
  ];

  const guidelines = [
    {
      title: "Respect & Support",
      description: "We maintain a supportive environment where men can share vulnerably without fear of judgment"
    },
    {
      title: "Constructive Dialogue",
      description: "All discussions focus on helping each other grow and succeed in healthy relationships"
    },
    {
      title: "Privacy Protection",
      description: "Strict anonymity rules ensure your personal information and stories stay private"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>A Verified, Men-Only Dating Community | Juice</title>
        <meta name="description" content="A verified, men-only space to look up and review the women you've dated — green flags and red. Reviewers stay anonymous; no public profiles." />
        <link rel="canonical" href="https://sipjuice.app/male-dating-community" />
        <meta property="og:title" content="A Verified, Men-Only Dating Community | Juice" />
        <meta property="og:description" content="A verified, men-only space to look up and review the women you've dated — green flags and red. Reviewers stay anonymous; no public profiles." />
        <meta property="og:url" content="https://sipjuice.app/male-dating-community" />
        <meta property="og:type" content="website" />
      </Helmet>
      {/* Header */}

      <main>
      {/* Hero Section */}
      <section className="px-4 pt-14 pb-16 md:pt-20">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-display font-extrabold uppercase leading-[0.9] tracking-tight text-5xl md:text-6xl lg:text-7xl text-foreground mb-6 max-w-4xl">
            A Verified Dating Community —{" "}
            <span className="text-primary">
              Built for Men
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl leading-relaxed">
            Verified men share real dating stories, advice, and honest experiences — with full anonymity and no judgment.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="xl" variant="juice" asChild className="font-bold">
              <Link to="/app">
                Request Access
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild>
              <Link to="/how-it-works">See How It Works</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4 uppercase tracking-[0.18em] font-semibold">
            Free • Verified men only • 100% anonymous
          </p>
        </div>
      </section>

      {/* Community Stats */}
      <section className="px-4 py-16 md:py-20 bg-secondary">
        <div className="max-w-6xl mx-auto">
          <div className="border-t-2 border-foreground pt-4 mb-10 flex items-baseline justify-between gap-4 flex-wrap">
            <h2 className="font-display font-extrabold uppercase tracking-tight text-3xl md:text-4xl text-foreground">
              How the Community Works
            </h2>
            <p className="text-sm text-muted-foreground">
              What makes Juice different at a structural level
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {communityStats.map((stat, index) => (
              <div key={index} className="border-t border-border pt-5">
                <span className="font-display font-extrabold text-4xl text-primary leading-none block mb-3">
                  {stat.number}
                </span>
                <h3 className="text-lg font-bold text-foreground mb-1">{stat.label}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{stat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Features */}
      <section className="px-4 py-16 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="border-t-2 border-foreground pt-4 mb-10 flex items-baseline justify-between gap-4 flex-wrap">
            <h2 className="font-display font-extrabold uppercase tracking-tight text-3xl md:text-4xl text-foreground">
              What Sets Juice Apart
            </h2>
            <p className="text-sm text-muted-foreground">
              The features that matter most.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0 md:gap-y-2">
            {communityFeatures.map((feature, index) => (
              <div key={index} className="border-t border-border py-6 flex gap-5">
                <span className="font-display font-extrabold text-2xl text-primary leading-none pt-0.5 w-10 shrink-0" aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-base font-bold text-foreground mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    {feature.description}
                  </p>
                  <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground mb-2">Benefits:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {feature.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-success shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What Men Share */}
      <section className="px-4 py-16 md:py-20 bg-secondary">
        <div className="max-w-6xl mx-auto">
          <div className="border-t-2 border-foreground pt-4 mb-10 flex items-baseline justify-between gap-4 flex-wrap">
            <h2 className="font-display font-extrabold uppercase tracking-tight text-3xl md:text-4xl text-foreground">
              Real Topics. Real Talk.
            </h2>
            <p className="text-sm text-muted-foreground">
              Real topics from real men helping each other succeed in dating
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0">
            {whatMenShare.map((topic, index) => (
              <div key={index} className="border-t border-border py-5 flex items-baseline gap-4">
                <span className="font-display font-extrabold text-lg text-primary leading-none w-8 shrink-0" aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="text-foreground font-medium">{topic}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Guidelines */}
      <section className="px-4 py-16 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="border-t-2 border-foreground pt-4 mb-10 flex items-baseline justify-between gap-4 flex-wrap">
            <h2 className="font-display font-extrabold uppercase tracking-tight text-3xl md:text-4xl text-foreground">
              How We Keep It Honest
            </h2>
            <p className="text-sm text-muted-foreground">
              What makes our community a safe and supportive space for all men
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {guidelines.map((guideline, index) => (
              <div key={index} className="border-t border-border pt-5">
                <span className="font-display font-extrabold text-2xl text-primary leading-none block mb-3" aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="text-lg font-bold text-foreground mb-2">{guideline.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {guideline.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join CTA — flat ink band */}
      <section className="bg-foreground text-background">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <h2 className="font-display font-extrabold uppercase tracking-tight leading-[0.95] text-4xl md:text-6xl mb-4 max-w-3xl">
            Verified stories from men who've been where you are.
          </h2>
          <p className="text-lg text-background/70 mb-10 max-w-xl">
            Juice is a private, verified space — no public profiles, no drama.
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <Button size="xl" variant="juice" asChild className="font-bold w-fit">
              <Link to="/app">
                Join free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <p className="text-sm text-background/60 uppercase tracking-[0.18em] font-semibold">
              Free • Verified • Anonymous
            </p>
          </div>
        </div>
      </section>
      </main>

      {/* SEO Footer */}
    </div>
  );
};

export default MaleDatingCommunity;
