import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const DatingStoriesForMen = () => {
  const stats = [
    { number: "Verified", label: "Members only" },
    { number: "Anonymous", label: "Every story, every time" },
    { number: "Anonymous", label: "Reviewers stay hidden" },
    { number: "Manual", label: "Approval to join" }
  ];

  const storyTypes = [
    {
      title: "First Date Experiences",
      description: "Real stories about first dates - the good, bad, and everything in between"
    },
    {
      title: "Relationship Reviews",
      description: "Honest ratings and reviews of dating experiences and relationships"
    },
    {
      title: "Dating App Stories",
      description: "Real experiences from Tinder, Bumble, Hinge and other dating platforms"
    },
    {
      title: "Red Flag Warnings",
      description: "Men sharing warning signs and red flags to help others avoid problems"
    }
  ];

  const benefits = [
    {
      title: "100% Anonymous",
      description: "Share your real experiences without revealing your identity. Complete privacy guaranteed."
    },
    {
      title: "Men-Only Community",
      description: "A space designed specifically for men to share honest dating experiences without judgment."
    },
    {
      title: "Verified Users",
      description: "All stories come from verified men, ensuring authentic and trustworthy experiences."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Anonymous Dating Stories from Verified Men | Juice</title>
        <meta name="description" content="Real, unfiltered dating stories from verified men — first dates, red flags, and app disasters. Read what actually happened, anonymously." />
        <link rel="canonical" href="https://sipjuice.app/dating-stories-for-men" />
        <meta property="og:title" content="Anonymous Dating Stories from Verified Men | Juice" />
        <meta property="og:description" content="Real, unfiltered dating stories from verified men — first dates, red flags, and app disasters. Read what actually happened, anonymously." />
        <meta property="og:url" content="https://sipjuice.app/dating-stories-for-men" />
        <meta property="og:type" content="website" />
      </Helmet>
      {/* Header */}

      <main>
      {/* Hero Section */}
      <section className="px-4 pt-14 pb-16 md:pt-20">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-display font-extrabold uppercase leading-[0.9] tracking-tight text-5xl md:text-6xl lg:text-7xl text-foreground mb-6 max-w-4xl">
            Dating Stories from{" "}
            <span className="text-primary">
              Verified Men — Anonymous & Unfiltered
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl leading-relaxed">
            Read anonymous dating experiences from verified men. Honest, unrated by influencers, unsponsored.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="xl" variant="juice" asChild className="font-bold">
              <Link to="/app">
                Browse Stories
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild>
              <Link to="/how-it-works">See How It Works</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-4 py-16 bg-secondary">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="border-t border-border pt-5">
                <div className="font-display font-extrabold text-3xl text-primary leading-none mb-3">{stat.number}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Types */}
      <section className="px-4 py-16 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="border-t-2 border-foreground pt-4 mb-10 flex items-baseline justify-between gap-4 flex-wrap">
            <h2 className="font-display font-extrabold uppercase tracking-tight text-3xl md:text-4xl text-foreground">
              What Men Share on Juice
            </h2>
            <p className="text-sm text-muted-foreground">
              From first dates to long-term relationships - men share it all anonymously
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0 md:gap-y-2">
            {storyTypes.map((type, index) => (
              <div key={index} className="border-t border-border py-6 flex gap-5">
                <span className="font-display font-extrabold text-2xl text-primary leading-none pt-0.5 w-10 shrink-0" aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-base font-bold text-foreground mb-1">{type.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {type.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="px-4 py-16 md:py-20 bg-secondary">
        <div className="max-w-6xl mx-auto">
          <div className="border-t-2 border-foreground pt-4 mb-10">
            <h2 className="font-display font-extrabold uppercase tracking-tight text-3xl md:text-4xl text-foreground">
              Why Juice, Not Reddit or DMs
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="border-t border-border pt-5">
                <span className="font-display font-extrabold text-2xl text-primary leading-none block mb-3" aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="text-lg font-bold text-foreground mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section — flat ink band */}
      <section className="bg-foreground text-background">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <h2 className="font-display font-extrabold uppercase tracking-tight leading-[0.95] text-4xl md:text-6xl mb-4 max-w-3xl">
            The story you need is already in there.
          </h2>
          <p className="text-lg text-background/70 mb-10 max-w-xl">
            Join a verified community of men sharing authentic dating experiences.
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <Button size="xl" variant="juice" asChild className="font-bold w-fit">
              <Link to="/app">
                Browse Stories
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <p className="text-sm text-background/60 uppercase tracking-[0.18em] font-semibold">
              Free to join • Anonymous sharing • Verified community
            </p>
          </div>
        </div>
      </section>
      </main>

      {/* SEO Footer */}
    </div>
  );
};

export default DatingStoriesForMen;
