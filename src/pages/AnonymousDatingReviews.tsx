import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const AnonymousDatingReviews = () => {
  const reviewTypes = [
    {
      title: "Dating App Reviews",
      description: "Anonymous reviews of Tinder, Bumble, Hinge matches and conversations",
      examples: ["Tinder date reviews", "Bumble experience ratings", "Hinge conversation reviews"]
    },
    {
      title: "First Date Reviews",
      description: "Honest ratings and reviews of first date experiences",
      examples: ["Restaurant date reviews", "Activity date ratings", "Coffee date experiences"]
    },
    {
      title: "Relationship Reviews",
      description: "Anonymous reviews of dating relationships and partners",
      examples: ["Compatibility ratings", "Communication reviews", "Overall relationship scores"]
    },
    {
      title: "Hookup Reviews",
      description: "Anonymous reviews of casual dating and hookup experiences",
      examples: ["Casual dating reviews", "Hookup experience ratings", "Safety and communication scores"]
    }
  ];

  const ratingCategories = [
    { category: "Communication", description: "How well did they communicate?" },
    { category: "Emotional Safety", description: "Did you feel emotionally safe?" },
    { category: "Overall Vibe", description: "What was the overall experience like?" },
    { category: "Loyalty", description: "Were they honest and trustworthy?" }
  ];

  const privacyPoints = [
    {
      title: "No Names Revealed",
      description: "Reviews are completely anonymous - no personal information shared"
    },
    {
      title: "Secure Platform",
      description: "Advanced security keeps your reviews private and protected"
    },
    {
      title: "Verified Only",
      description: "Only verified men can read and write reviews"
    }
  ];

  const benefits = [
    {
      title: "Honest Feedback",
      description: "Anonymity allows for brutally honest reviews without social consequences"
    },
    {
      title: "Help Other Men",
      description: "Your anonymous reviews help other men make better dating decisions"
    },
    {
      title: "No Retaliation",
      description: "Complete anonymity means no worries about confrontation or backlash"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Anonymous Dating Reviews from Verified Men | Juice</title>
        <meta name="description" content="Read and rate anonymous date reviews from verified men — first dates, apps, and relationships. No names, no trace, just honest signal." />
        <link rel="canonical" href="https://sipjuice.app/anonymous-dating-reviews" />
        <meta property="og:title" content="Anonymous Dating Reviews from Verified Men | Juice" />
        <meta property="og:description" content="Read and rate anonymous date reviews from verified men — first dates, apps, and relationships. No names, no trace, just honest signal." />
        <meta property="og:url" content="https://sipjuice.app/anonymous-dating-reviews" />
        <meta property="og:type" content="website" />
      </Helmet>
      {/* Header */}

      <main>
      {/* Hero Section */}
      <section className="px-4 pt-14 pb-16 md:pt-20">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-display font-extrabold uppercase leading-[0.9] tracking-tight text-5xl md:text-6xl lg:text-7xl text-foreground mb-6 max-w-4xl">
            Anonymous Dating Reviews —{" "}
            <span className="text-primary">
              Written by Verified Men
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl leading-relaxed">
            Read honest date reviews from verified men. Write your own anonymously — no names, no trace.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="xl" asChild className="font-bold">
              <Link to="/app">
                Browse Verified Reviews
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild>
              <Link to="/app">Submit a Review</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Privacy Promise */}
      <section className="px-4 py-16 md:py-20 bg-secondary">
        <div className="max-w-6xl mx-auto">
          <div className="border-t-2 border-foreground pt-4 mb-10 flex items-baseline justify-between gap-4 flex-wrap">
            <h2 className="font-display font-extrabold uppercase tracking-tight text-3xl md:text-4xl text-foreground">
              Your identity never touches the review
            </h2>
            <p className="text-sm text-muted-foreground">
              Your identity is protected. Review with zero risk.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-0 md:gap-y-2">
            {privacyPoints.map((point, index) => (
              <div key={index} className="border-t border-border py-6 flex gap-5">
                <span className="font-display font-extrabold text-2xl text-primary leading-none pt-0.5 w-10 shrink-0" aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-base font-bold text-foreground mb-1">{point.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{point.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Review Types */}
      <section className="px-4 py-16 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="border-t-2 border-foreground pt-4 mb-10 flex items-baseline justify-between gap-4 flex-wrap">
            <h2 className="font-display font-extrabold uppercase tracking-tight text-3xl md:text-4xl text-foreground">
              What Men Review on Juice
            </h2>
            <p className="text-sm text-muted-foreground">
              Rate and review all your dating experiences with complete anonymity
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0 md:gap-y-2">
            {reviewTypes.map((type, index) => (
              <div key={index} className="border-t border-border py-6 flex gap-5">
                <span className="font-display font-extrabold text-2xl text-primary leading-none pt-0.5 w-10 shrink-0" aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-1">{type.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    {type.description}
                  </p>
                  <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground mb-2">Examples:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {type.examples.map((example, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rating System */}
      <section className="px-4 py-16 md:py-20 bg-secondary">
        <div className="max-w-6xl mx-auto">
          <div className="border-t-2 border-foreground pt-4 mb-10 flex items-baseline justify-between gap-4 flex-wrap">
            <h2 className="font-display font-extrabold uppercase tracking-tight text-3xl md:text-4xl text-foreground">
              4 Things Every Review Covers
            </h2>
            <p className="text-sm text-muted-foreground">
              Rate your experiences across these key areas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0 md:gap-y-2">
            {ratingCategories.map((category, index) => (
              <div key={index} className="border-t border-border py-6 flex gap-5">
                <span className="font-display font-extrabold text-2xl text-primary leading-none pt-0.5 w-10 shrink-0" aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-1">{category.category}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{category.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-4 py-16 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="border-t-2 border-foreground pt-4 mb-10">
            <h2 className="font-display font-extrabold uppercase tracking-tight text-3xl md:text-4xl text-foreground">
              Why Anonymity Unlocks Honesty
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-0 md:gap-y-2">
            {benefits.map((benefit, index) => (
              <div key={index} className="border-t border-border py-6 flex gap-5">
                <span className="font-display font-extrabold text-2xl text-primary leading-none pt-0.5 w-10 shrink-0" aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-base font-bold text-foreground mb-1">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section — flat ink band */}
      <section className="bg-foreground text-background">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <h2 className="font-display font-extrabold uppercase tracking-tight leading-[0.95] text-4xl md:text-6xl mb-4 max-w-3xl">
            The most honest dating reviews you'll ever read
          </h2>
          <p className="text-lg text-background/70 mb-10 max-w-xl">
            Join a verified community of men sharing honest dating reviews.
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <Button size="xl" asChild className="font-bold w-fit">
              <Link to="/app">
                Browse Reviews
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <p className="text-sm text-background/60 uppercase tracking-[0.18em] font-semibold">
              Free to join • 100% anonymous • Verified men only
            </p>
          </div>
        </div>
      </section>
      </main>

      {/* SEO Footer */}
    </div>
  );
};

export default AnonymousDatingReviews;
