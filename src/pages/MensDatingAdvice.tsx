import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, Shield, MessageSquare, ArrowRight, Lightbulb, Heart, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

const MensDatingAdvice = () => {

  // Actual advice, not topic teasers — this page has to stand on its own content.
  const adviceCategories = [
    {
      title: "First Date Tips",
      description: "Real advice from men who've been on hundreds of first dates",
      icon: <Heart className="h-6 w-6 text-primary" />,
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
      icon: <MessageSquare className="h-6 w-6 text-primary" />,
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
      icon: <AlertTriangle className="h-6 w-6 text-primary" />,
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
      icon: <Users className="h-6 w-6 text-primary" />,
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

  return (
    <div className="min-h-screen bg-gradient-soft">
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
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Dating Advice from{" "}
            <span className="text-primary">
              Men Who've Actually Been There
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Practical advice from verified men — not coaches, not influencers, not theory.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-lg px-8">
              <Link to="/app">
                Read Advice from Verified Men
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8">
              <Link to="/how-it-works">See How It Works</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Verified members only — apply to join
          </p>
        </div>
      </section>

      {/* Quick Tips */}
      <section className="py-16 px-4 bg-white/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Lightbulb className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-foreground mb-4">6 Things Verified Men Wish They'd Known Earlier</h2>
            <p className="text-xl text-muted-foreground">
              Essential advice — short, blunt, hard-won.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickTips.map((tip, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-white/80 rounded-lg shadow-card">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm mt-0.5">
                  {index + 1}
                </div>
                <p className="text-foreground font-medium">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advice Categories */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Advice for Every Stage of Dating
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Specific guidance, sorted by where you are right now.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {adviceCategories.map((category, index) => (
              <Card key={index} className="border-0 shadow-card bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {category.icon}
                    </div>
                    <CardTitle className="text-xl">{category.title}</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    {category.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {category.points.map((point, idx) => (
                      <div key={idx}>
                        <h4 className="font-semibold text-sm text-foreground mb-0.5">{point.tip}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{point.detail}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Our Advice Works */}
      <section className="py-20 px-4 bg-white/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Juice Advice Hits Different
            </h2>
            <p className="text-xl text-muted-foreground">
              From men with skin in the game — not pickup artists.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <Users className="h-12 w-12 text-primary mx-auto" />
              <h3 className="text-xl font-semibold">Real Experiences</h3>
              <p className="text-muted-foreground">
                Advice comes from men who've actually been in relationships, not just theory
              </p>
            </div>
            <div className="text-center space-y-4">
              <Shield className="h-12 w-12 text-primary mx-auto" />
              <h3 className="text-xl font-semibold">Anonymous Honesty</h3>
              <p className="text-muted-foreground">
                Men share brutally honest advice without worrying about judgment
              </p>
            </div>
            <div className="text-center space-y-4">
              <BookOpen className="h-12 w-12 text-primary mx-auto" />
              <h3 className="text-xl font-semibold">Proven Results</h3>
              <p className="text-muted-foreground">
                Strategies drawn from the real experiences our verified community shares
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="border-0 shadow-card bg-gradient-primary text-primary-foreground">
            <CardContent className="p-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Stop guessing. Read what verified men have figured out.
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Real dating experience and advice from a verified community of men.
              </p>
              <Button size="lg" variant="secondary" asChild className="text-lg px-8">
                <Link to="/app">
                  Read Verified Advice
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <p className="text-sm mt-4 opacity-75">
                Free to join • Real advice from real men • Anonymous community
              </p>
            </CardContent>
          </Card>
          <p className="text-muted-foreground mt-8">
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