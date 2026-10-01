import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const URL = "https://sipjuice.app/are-we-dating-the-same-girl";
const TITLE = "Are We Dating the Same Girl? The Men's Version | Juice";
const DESC =
  "Looking for an \"Are We Dating the Same Girl\" group? Juice is the men's version: verified men share anonymous green-flag and red-flag dating reviews you can search by name and city.";

const faqs = [
  {
    q: "Is there an \"Are We Dating the Same Girl\" group for men?",
    a: "The \"Are We Dating the Same Guy\" Facebook groups are run by and for women. Juice is built for men: an anonymous community where verified men share honest reviews of women they've dated, and search before a first date.",
  },
  {
    q: "How is Juice different from a Facebook group?",
    a: "Facebook groups tie every post to your real profile and depend on volunteer admins. On Juice you post under a codename, every member passes a human-reviewed selfie check, and stories are searchable by first name and city instead of buried in a scrolling feed.",
  },
  {
    q: "Will anyone know I posted?",
    a: "No. Your real name never appears on anything you post. The community only ever sees a codename.",
  },
  {
    q: "What if someone posts about a woman unfairly?",
    a: "Every post is reviewed by a moderator before it goes live, any post can be reported, and anyone — member or not — can request removal of a post about them through our public dispute page.",
  },
  {
    q: "Is Juice free?",
    a: "Yes. Joining, verification, searching, and posting are free.",
  },
];

const points = [
  {
    title: "Verified men only",
    body: "Every member passes a one-time selfie check reviewed by a human. No government ID, and you can delete the selfie afterward.",
  },
  {
    title: "Anonymous, not attached to your Facebook",
    body: "You post under a codename. No real name, no profile picture, no mutual friends seeing what you wrote.",
  },
  {
    title: "Searchable, not a scrolling feed",
    body: "Look up a first name and city and see what other men experienced — instead of posting a photo and waiting for comments.",
  },
  {
    title: "Juice or Milk — one clear verdict",
    body: "Every story ends with a green flag (Juice) or a red flag (Milk), so you get the answer at a glance.",
  },
];

const AreWeDatingTheSameGirl = () => {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{TITLE}</title>
        <meta name="description" content={DESC} />
        <link rel="canonical" href={URL} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESC} />
        <meta property="og:url" content={URL} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://sipjuice.app/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESC} />
        <meta name="twitter:image" content="https://sipjuice.app/og-image.png" />
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      <section className="px-4 pt-14 pb-16 md:pt-20">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-display font-extrabold uppercase leading-[0.9] tracking-tight text-5xl md:text-6xl lg:text-7xl text-foreground mb-6 max-w-4xl">
            Are we dating the same girl?{" "}
            <span className="text-primary">Now men can ask too.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl leading-relaxed">
            Women have "Are We Dating the Same Guy" groups. Juice is the men's version — verified
            men sharing anonymous, honest reviews of the women they've dated, searchable before your
            next first date.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <Button size="xl" asChild className="font-bold">
              <Link to="/app">Join Juice free <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button size="xl" variant="outline" asChild>
              <Link to="/how-it-works">How it works</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 md:py-20 bg-secondary">
        <div className="max-w-6xl mx-auto">
          <div className="border-t-2 border-foreground pt-4 mb-10">
            <h2 className="font-display font-extrabold uppercase tracking-tight text-3xl md:text-4xl text-foreground">
              Why men don't have these groups
            </h2>
          </div>
          <div className="max-w-3xl space-y-4">
            <p className="text-lg text-muted-foreground leading-relaxed">
              The "Are We Dating the Same Guy" groups started on Facebook so women could compare
              notes before a date. Men have wanted the same thing, but a Facebook group means posting
              under your real name, in front of your friends and coworkers.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Juice keeps the useful part — hearing from men who've already been on the date — and
              drops the exposure. See also how Juice compares to the{" "}
              <Link to="/tea-app-comparison" className="text-primary underline underline-offset-4">
                Tea app
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="border-t-2 border-foreground pt-4 mb-10">
            <h2 className="font-display font-extrabold uppercase tracking-tight text-3xl md:text-4xl text-foreground">
              How Juice works for men
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 md:gap-y-2">
            {points.map((d, i) => (
              <div key={d.title} className="border-t border-border py-6 flex gap-5">
                <span className="font-display font-extrabold text-2xl text-primary leading-none pt-0.5 w-10 shrink-0" aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-base font-bold text-foreground mb-1">{d.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{d.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 md:py-20 bg-secondary">
        <div className="max-w-6xl mx-auto">
          <div className="border-t-2 border-foreground pt-4 mb-8">
            <h2 className="font-display font-extrabold uppercase tracking-tight text-3xl md:text-4xl text-foreground">
              Questions, answered
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

      <section className="bg-foreground text-background">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <h2 className="font-display font-extrabold uppercase tracking-tight leading-[0.95] text-4xl md:text-6xl mb-4 max-w-3xl">
            Find out before the first date
          </h2>
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-background/70 mb-10">
            <span className="flex items-center gap-2 text-sm font-semibold"><Check className="h-4 w-4 text-primary" /> Every member human-verified</span>
            <span className="flex items-center gap-2 text-sm font-semibold"><Check className="h-4 w-4 text-primary" /> Anonymous to post</span>
            <span className="flex items-center gap-2 text-sm font-semibold"><Check className="h-4 w-4 text-primary" /> Free</span>
          </div>
          <Button size="xl" asChild className="font-bold w-fit">
            <Link to="/app">Get the Juice <ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default AreWeDatingTheSameGirl;
