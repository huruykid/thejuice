import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronDown, Flag } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { landingPhotoUrl } from "@/lib/landingPhotos";

const Landing = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && user) {
      navigate("/app");
    }
  }, [user, loading, navigate]);

  const features = [
    {
      title: "You're anonymous. They're verified.",
      description: "Post without your name attached. Every person you read about was submitted by a verified, real member.",
    },
    {
      title: "For men, by men.",
      description: "A space where men can be honest about dating experiences without social consequences or judgment.",
    },
    {
      title: "Rate it. Learn from it.",
      description: "Rate loyalty, communication, vibe, and respect. Help other men see patterns before they live through them.",
    },
    {
      title: "Zero consequences.",
      description: "Share the real story. No backlash. No screenshots. No drama. The community keeps it contained.",
    },
  ];

  const steps = [
    {
      title: "Verify your identity",
      description: "One quick selfie. A real human reviews it. Your photo is never stored publicly.",
    },
    {
      title: "Read the feed",
      description: "Browse verified stories. Rate them. Comment. See what other men have lived through.",
    },
    {
      title: "Share the Juice",
      description: "Post under your codename — green flag or red, with the story. You stay anonymous.",
    },
  ];

  const testimonials = [
    {
      quote: "Finally an app where I can get honest dating advice from men who've actually been there.",
      codename: "late_checkout",
    },
    {
      quote: "The verification system makes all the difference. These are real stories from real men.",
      codename: "quietly_done",
    },
    {
      quote: "Wish I had this before my last relationship. The red flags were all there in other men's stories.",
      codename: "third_strike",
    },
  ];

  const faqs = [
    {
      question: "Is it free?",
      answer: "Yes. Juice is free to join. Creating an account, reading stories, and posting your own — all free.",
    },
    {
      question: "Are stories actually anonymous?",
      answer: "Yes. Your name is never attached to your stories. You post under a randomly assigned codename. The only thing that's verified is that you're a real man — not who you are.",
    },
    {
      question: "Who reviews my selfie?",
      answer: "A real human admin reviews your selfie to confirm you're a real person. Your photo is never stored publicly or shared. It's used only for the one-time verification check.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>The Tea App for Men — Anonymous Dating Reviews | Juice</title>
        <meta name="description" content="Juice is the Tea app for men: verified men share honest reviews of the women they've dated — green flags and red. Look someone up before your next date. Free to join." />
        <link rel="canonical" href="https://sipjuice.app/" />
        <meta property="og:title" content="The Tea App for Men — Anonymous Dating Reviews | Juice" />
        <meta property="og:description" content="Juice is the Tea app for men: verified men share honest reviews of the women they've dated — green flags and red. Look someone up before your next date. Free to join." />
        <meta property="og:url" content="https://sipjuice.app/" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            { "@type": "Question", "name": "Is it free?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. Juice is free to join. Creating an account, reading stories, and posting your own — all free." } },
            { "@type": "Question", "name": "Are stories actually anonymous?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. Your name is never attached to your stories. You post under a randomly assigned codename. The only thing that's verified is that you're a real man — not who you are." } },
            { "@type": "Question", "name": "Who reviews my selfie?", "acceptedAnswer": { "@type": "Answer", "text": "A real human admin reviews your selfie to confirm you're a real person. Your photo is never stored publicly or shared. It's used only for the one-time verification check." } }
          ]
        })}</script>
      </Helmet>

      <main>
        {/* Wire strip — masthead ticker instead of a floating pill badge */}
        <div className="border-y border-border">
          <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-3 overflow-x-auto whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <span className="text-primary">Verified men only</span>
            <span aria-hidden className="text-border">/</span>
            <span>Anonymous to post</span>
            <span aria-hidden className="text-border">/</span>
            <span>Free to join</span>
            <span aria-hidden className="text-border">/</span>
            <span>No names. Codenames.</span>
          </div>
        </div>

        {/* Hero — asymmetric front page: type-led left, product artifact right */}
        <section className="px-4 pt-14 pb-16 md:pt-20">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.2fr,0.8fr] gap-12 lg:gap-8 items-start">
            <div>
              <h1 className="font-display font-extrabold uppercase leading-[0.9] tracking-tight text-6xl md:text-7xl lg:text-8xl text-foreground mb-6">
                The Tea app,
                <br />
                <span className="text-primary">but for men.</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-xl mb-8 leading-relaxed">
                See what verified men really experienced with the women they've dated —
                green flags and red. Look her up before your next date. You post anonymously.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <Button size="xl" variant="juice" asChild className="font-bold">
                  <Link to="/app">
                    Join free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="xl" variant="outline" asChild>
                  <Link to="/how-it-works">How it works</Link>
                </Button>
              </div>

              <p className="text-sm text-muted-foreground mb-10">
                Already a member?{" "}
                <Link to="/app?mode=login" className="text-primary font-semibold hover:underline">
                  Log in
                </Link>
              </p>

              {/* The product's core primitive, stated plainly — every story ends one of two ways */}
              <div className="border-t border-border pt-5 max-w-xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3">
                  Every story ends one of two ways
                </p>
                <div className="flex flex-wrap gap-x-8 gap-y-2">
                  <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Flag className="h-4 w-4 text-success fill-success" aria-hidden />
                    Green flag — date her
                  </span>
                  <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Flag className="h-4 w-4 text-destructive fill-destructive" aria-hidden />
                    Red flag — read this first
                  </span>
                </div>
              </div>
            </div>

            {/* App mockup — the feed is the pitch; keep it as the only image on the page.
                Capped height + bottom fade so the hero stays balanced; the feed reads as a crop. */}
            <div className="max-w-xs mx-auto lg:mx-0 lg:justify-self-end w-full relative max-h-[560px] overflow-hidden rounded-2xl">
              <div className="bg-background border border-border rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-background px-4 py-2 flex items-center justify-between border-b border-border">
                  <span className="text-xs font-semibold text-foreground">The Juice App</span>
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/20" />
                  </div>
                </div>
                {/* Mock cards — mirror the real StoryCard: subject (her name + photo) on top, anonymous reviewer below */}
                {[
                  { subject: "Maya", author: "throwback_j", time: "2h", flag: "red", flags: "ghosted after 3 great months", green: 12, red: 34 },
                  { subject: "Jess", author: "quietly_done", time: "5h", flag: "green", flags: "loyal · honest to a fault", green: 41, red: 3 },
                  { subject: "Bri", author: "weekend_plans", time: "8h", flag: "red", flags: "hot & cold all week", green: 8, red: 29 },
                ].map((card, i) => (
                  <div key={i} className="border-b border-border last:border-b-0 bg-background">
                    <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold shrink-0">
                        {card.subject[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{card.subject}</p>
                        <p className="text-[10px] text-muted-foreground">@{card.author} · {card.time} ago</p>
                      </div>
                      <Flag
                        className={`h-3.5 w-3.5 shrink-0 ${card.flag === "green" ? "text-success fill-success" : "text-destructive fill-destructive"}`}
                        aria-hidden
                      />
                    </div>
                    {/* Subject photo — admin-uploaded (landing-assets). Soft fallback if none. */}
                    <div className="aspect-square w-full bg-muted relative overflow-hidden">
                      <img
                        src={landingPhotoUrl(i + 1)}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                      />
                    </div>
                    <div className="px-3 py-2.5">
                      <div className="space-y-1 mb-2">
                        <div className="h-2 bg-muted rounded w-full" />
                        <div className="h-2 bg-muted rounded w-5/6" />
                        <div className="h-2 bg-muted rounded w-3/4" />
                      </div>
                      <p className="text-[10px] text-muted-foreground mb-1.5">{card.flags}</p>
                      <div className="flex items-center gap-3 text-[10px] font-semibold">
                        <span className="text-success">⚑ {card.green}</span>
                        <span className="text-destructive">⚑ {card.red}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background/80 to-transparent rounded-b-2xl pointer-events-none" />
            </div>
          </div>
        </section>

        {/* Features — numbered editorial index, not icon cards */}
        <section className="px-4 py-16 md:py-20">
          <div className="max-w-6xl mx-auto">
            <div className="border-t-2 border-foreground pt-4 mb-10 flex items-baseline justify-between gap-4 flex-wrap">
              <h2 className="font-display font-extrabold uppercase tracking-tight text-3xl md:text-4xl text-foreground">
                Why men choose Juice
              </h2>
              <p className="text-sm text-muted-foreground">
                The only verified, anonymous space built for honest dating stories.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0 md:gap-y-2">
              {features.map((feature, index) => (
                <div key={index} className="border-t border-border py-6 flex gap-5">
                  <span className="font-display font-extrabold text-2xl text-primary leading-none pt-0.5 w-10 shrink-0" aria-hidden>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-foreground mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works — ruled columns, condensed numerals */}
        <section className="px-4 py-16 md:py-20 bg-secondary">
          <div className="max-w-6xl mx-auto">
            <div className="border-t-2 border-foreground pt-4 mb-10 flex items-baseline justify-between gap-4 flex-wrap">
              <h2 className="font-display font-extrabold uppercase tracking-tight text-3xl md:text-4xl text-foreground">
                Three steps to your first story
              </h2>
              <p className="text-sm text-muted-foreground">Verified and posting in under two minutes.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((step, index) => (
                <div key={index} className="border-t border-border pt-5">
                  <span className="font-display font-extrabold text-5xl text-primary leading-none block mb-3" aria-hidden>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* From the feed — pull-quotes under codenames, consistent with the product's anonymity */}
        <section className="px-4 py-16 md:py-20">
          <div className="max-w-6xl mx-auto">
            <div className="border-t-2 border-foreground pt-4 mb-10">
              <h2 className="font-display font-extrabold uppercase tracking-tight text-3xl md:text-4xl text-foreground">
                From verified members
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {testimonials.map((testimonial, index) => (
                <figure key={index} className="border-l-2 border-primary pl-5">
                  <blockquote className="text-lg font-medium text-foreground leading-snug mb-4">
                    "{testimonial.quote}"
                  </blockquote>
                  <figcaption className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">@{testimonial.codename}</span> · verified member
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ — ruled list, no boxes */}
        <section className="px-4 py-16 md:py-20">
          <div className="max-w-6xl mx-auto">
            <div className="border-t-2 border-foreground pt-4 mb-8">
              <h2 className="font-display font-extrabold uppercase tracking-tight text-3xl md:text-4xl text-foreground">
                Common questions
              </h2>
            </div>

            <div className="divide-y divide-border border-b border-border max-w-3xl">
              {faqs.map((faq, index) => (
                <div key={index}>
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    aria-expanded={openFaq === index}
                    className="w-full flex items-center justify-between py-5 text-left gap-4 hover:text-primary transition-colors"
                  >
                    <span className="font-bold text-foreground">{faq.question}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${openFaq === index ? "rotate-180" : ""}`}
                    />
                  </button>
                  {openFaq === index && (
                    <div className="pb-5 text-sm text-muted-foreground leading-relaxed max-w-xl">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA — flat ink band, no gradient card */}
        <section className="bg-foreground text-background">
          <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
            <h2 className="font-display font-extrabold uppercase tracking-tight leading-[0.95] text-4xl md:text-6xl mb-4 max-w-3xl">
              You've been holding back long enough.
            </h2>
            <p className="text-lg text-background/70 mb-10 max-w-xl">
              Juice is the only verified, anonymous space built for men to share and read real dating stories.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <Button size="xl" variant="juice" asChild className="font-bold w-fit">
                <Link to="/app">
                  Join free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <p className="text-sm text-background/60 uppercase tracking-[0.18em] font-semibold">
                Free · Anonymous · Verified men only
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Landing;
