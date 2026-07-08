import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const MensDatingAdvice = () => {

  // Actual advice, not topic teasers — this page has to stand on its own content.
  const adviceCategories = [
    {
      title: "First Date Tips",
      description: "Real advice from men who've been on hundreds of first dates",
      points: [
        {
          tip: "Pick a place where you can actually talk",
          detail: "Coffee, a walk, or a quiet bar beats dinner or a movie. A 45-minute low-stakes date tells you more than a two-hour production, and either of you can extend it if it's going well.",
        },
        {
          tip: "Ask questions you actually want answered",
          detail: "Scripted openers read as scripted. 'What's keeping you busy lately?' starts more real conversations than any line — and how she talks about her week tells you plenty.",
        },
        {
          tip: "Watch how she treats the staff",
          detail: "The most consistent green/red flag men report: how a date treats waiters, drivers, and bartenders is how she'll eventually treat you.",
        },
        {
          tip: "End it clearly, either way",
          detail: "If you're interested, say so before you leave — 'I'd like to do this again' costs nothing. If you're not, don't schedule a fake second date to be polite. Ghosting is how you end up reviewed.",
        },
      ],
    },
    {
      title: "Dating App Strategy",
      description: "Proven strategies for Tinder, Bumble, Hinge and other apps",
      points: [
        {
          tip: "Your first photo decides everything",
          detail: "One clear, recent photo of your face, decent light, no sunglasses, no group shots. Most swipes are decided in under a second — the rest of your profile only matters if photo one lands.",
        },
        {
          tip: "Write a profile she can reply to",
          detail: "A specific hook ('trying every taco place in Austin, ranked spreadsheet and all') gives her something to say. 'I love travel and good vibes' gives her nothing.",
        },
        {
          tip: "Move to a date within a week",
          detail: "Endless chat kills momentum and wastes both your time. Two or three good exchanges, then suggest something concrete: day, time, place.",
        },
        {
          tip: "Verify before you invest",
          detail: "Video call or look her up first. Reverse-image-search profile photos if something feels off — catfishing is still the most common story men share here.",
        },
      ],
    },
    {
      title: "Red Flag Recognition",
      description: "Learn to spot warning signs early from men's experiences",
      points: [
        {
          tip: "Inconsistent stories are the flag",
          detail: "Details that shift between tellings — job, ex, living situation — are the single most reported early warning sign in stories on Juice. One slip is memory; a pattern is a pattern.",
        },
        {
          tip: "Hot-and-cold is a strategy, not a mood",
          detail: "Intense attention followed by days of silence, repeated, keeps you chasing. Men consistently report this cycle preceded the worst outcomes.",
        },
        {
          tip: "Watch the money conversation",
          detail: "Comfortable isn't the issue — entitlement is. Early pressure about what you drive, earn, or can pay for tells you what the relationship is for.",
        },
        {
          tip: "Ignoring a flag doesn't retire it",
          detail: "Almost every red-flag story ends the same way: 'the signs were there on date two.' If your gut flagged it, write it down — you're building the case you'll wish you'd read.",
        },
      ],
    },
    {
      title: "Relationship Building",
      description: "How to build healthy, lasting relationships with women",
      points: [
        {
          tip: "Say the hard thing early",
          detail: "Exclusivity, kids, religion, money — the conversations men avoid for months are the ones that end relationships at month eight. Early honesty filters; late honesty detonates.",
        },
        {
          tip: "Boundaries only work if they cost something",
          detail: "A boundary with no consequence is a suggestion. Decide what you'll actually do when it's crossed, say it once, and follow through calmly.",
        },
        {
          tip: "Keep your life",
          detail: "The friends, gym, and hobbies you drop in month one are the self you'll resent losing by month six. The relationship should join your life, not replace it.",
        },
        {
          tip: "Trust is built in small repairs",
          detail: "Every couple fights; good ones repair fast. Own your part specifically ('I shouldn't have raised my voice'), skip the 'but', and watch whether she can do the same.",
        },
      ],
    },
  ];

  const quickTips = [
    "Be yourself - authenticity attracts the right person",
    "Listen more than you talk on first dates",
    "Ignoring red flags doesn't make them disappear",
    "Confidence comes from self-respect, not arrogance",
    "One real connection beats ten mediocre ones",
    "Set clear boundaries and stick to them"
  ];

  const whyItWorks = [
    {
      title: "Real Experiences",
      detail: "Advice comes from men who've actually been in relationships, not just theory",
    },
    {
      title: "Anonymous Honesty",
      detail: "Men share brutally honest advice without worrying about judgment",
    },
    {
      title: "Proven Results",
      detail: "Strategies drawn from the real experiences our verified community shares",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Real Dating Advice from Men Who've Been There | Juice</title>
        <meta name="description" content="Honest dating advice from verified men who've actually been there — first dates, red flags, and apps. No coaches, no pickup artists, no theory." />
        <link rel="canonical" href="https://sipjuice.app/mens-dating-advice" />
        <meta property="og:title" content="Real Dating Advice from Men Who've Been There | Juice" />
        <meta property="og:description" content="Honest dating advice from verified men who've actually been there — first dates, red flags, and apps. No coaches, no pickup artists, no theory." />
        <meta property="og:url" content="https://sipjuice.app/mens-dating-advice" />
        <meta property="og:type" content="website" />
      </Helmet>
      {/* Header */}

      <main>
      {/* Hero Section */}
      <section className="px-4 pt-14 pb-16 md:pt-20">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-display font-extrabold uppercase leading-[0.9] tracking-tight text-5xl md:text-6xl lg:text-7xl text-foreground mb-6 max-w-4xl">
            Dating Advice from{" "}
            <span className="text-primary">
              Men Who've Actually Been There
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl leading-relaxed">
            Practical advice from verified men — not coaches, not influencers, not theory.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="xl" variant="juice" asChild className="font-bold">
              <Link to="/app">
                Read Advice from Verified Men
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild>
              <Link to="/how-it-works">See How It Works</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4 uppercase tracking-[0.18em] font-semibold">
            Free · Anonymous · Verified men only
          </p>
        </div>
      </section>

      {/* Quick Tips */}
      <section className="px-4 py-16 md:py-20 bg-secondary">
        <div className="max-w-6xl mx-auto">
          <div className="border-t-2 border-foreground pt-4 mb-10 flex items-baseline justify-between gap-4 flex-wrap">
            <h2 className="font-display font-extrabold uppercase tracking-tight text-3xl md:text-4xl text-foreground">6 Things Verified Men Wish They'd Known Earlier</h2>
            <p className="text-sm text-muted-foreground">
              Essential advice — short, blunt, hard-won.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0 md:gap-y-2">
            {quickTips.map((tip, index) => (
              <div key={index} className="border-t border-border py-6 flex gap-5">
                <span className="font-display font-extrabold text-2xl text-primary leading-none pt-0.5 w-10 shrink-0" aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="text-foreground font-medium">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advice Categories */}
      <section className="px-4 py-16 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="border-t-2 border-foreground pt-4 mb-10 flex items-baseline justify-between gap-4 flex-wrap">
            <h2 className="font-display font-extrabold uppercase tracking-tight text-3xl md:text-4xl text-foreground">
              Advice for Every Stage of Dating
            </h2>
            <p className="text-sm text-muted-foreground">
              Specific guidance, sorted by where you are right now.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0 md:gap-y-2">
            {adviceCategories.map((category, index) => (
              <div key={index} className="border-t border-border py-8 flex gap-5">
                <span className="font-display font-extrabold text-2xl text-primary leading-none pt-1 w-10 shrink-0" aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-display font-extrabold uppercase tracking-tight text-xl text-foreground mb-1">{category.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                    {category.description}
                  </p>
                  <div className="space-y-4">
                    {category.points.map((point, idx) => (
                      <div key={idx}>
                        <h4 className="font-semibold text-sm text-foreground mb-0.5">{point.tip}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{point.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Our Advice Works */}
      <section className="px-4 py-16 md:py-20 bg-secondary">
        <div className="max-w-6xl mx-auto">
          <div className="border-t-2 border-foreground pt-4 mb-10 flex items-baseline justify-between gap-4 flex-wrap">
            <h2 className="font-display font-extrabold uppercase tracking-tight text-3xl md:text-4xl text-foreground">
              Why Juice Advice Hits Different
            </h2>
            <p className="text-sm text-muted-foreground">
              From men with skin in the game — not pickup artists.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {whyItWorks.map((item, index) => (
              <div key={item.title} className="border-t border-border pt-5">
                <span className="font-display font-extrabold text-5xl text-primary leading-none block mb-3" aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section — flat ink band */}
      <section className="bg-foreground text-background">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <h2 className="font-display font-extrabold uppercase tracking-tight leading-[0.95] text-4xl md:text-6xl mb-4 max-w-3xl">
            Stop guessing. Read what verified men have figured out.
          </h2>
          <p className="text-lg text-background/70 mb-10 max-w-xl">
            Real dating experience and advice from a verified community of men.
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <Button size="xl" variant="juice" asChild className="font-bold w-fit">
              <Link to="/app">
                Read Verified Advice
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <p className="text-sm text-background/60 uppercase tracking-[0.18em] font-semibold">
              Free to join • Real advice from real men • Anonymous community
            </p>
          </div>
        </div>
      </section>

      {/* Internal links */}
      <section className="px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm text-muted-foreground leading-relaxed">
            More from Juice: real{" "}
            <Link to="/dating-stories-for-men" className="text-primary underline underline-offset-4">
              dating stories from men
            </Link>
            , the{" "}
            <Link to="/tea-app-comparison" className="text-primary underline underline-offset-4">
              Tea app for men
            </Link>
            , and the{" "}
            <Link to="/blog" className="text-primary underline underline-offset-4">
              Juice blog
            </Link>
            .
          </p>
        </div>
      </section>
      </main>

      {/* SEO Footer */}
    </div>
  );
};

export default MensDatingAdvice;
