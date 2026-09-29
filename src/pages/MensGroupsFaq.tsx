import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const URL = "https://sipjuice.app/mens-groups-faq";
const TITLE = "Men's Dating Groups FAQ | Why Facebook Groups Don't Work for Men | Juice";
const DESC =
  "Common questions about men's dating groups: why Facebook groups don't work for men, how anonymous dating reviews stay fair, and how Juice handles verification, moderation and removals.";

const faqs = [
  {
    q: "Why won't Facebook groups work for men?",
    a: "A Facebook group ties every post to your real profile — your photo, your workplace, your mutual friends. Women's groups work partly because members accept that exposure; most men won't post a dating story their coworkers could read. Groups also rely on volunteer admins, get reported and removed regularly, and bury everything in a scrolling feed you can't search. Juice fixes all four: codenames instead of real profiles, human moderation instead of volunteers, a permanent home instead of a group that can vanish, and search by name and city instead of endless scrolling.",
  },
  {
    q: "Are men's dating groups even allowed?",
    a: "Groups where men discuss dating experiences are not banned, but they are removed often on social platforms for harassment and privacy reports, usually because posts include photos, full names or contact details. Juice is built to stay on the right side of that: no photos of the person being discussed, first names and city only, moderation before anything publishes, and a removal process anyone can use.",
  },
  {
    q: "How is this different from an \"Are We Dating the Same Guy\" group?",
    a: "Same idea, opposite audience and a different design. Those groups are for women and live on Facebook. Juice is for verified men, is anonymous by default, and is searchable rather than a feed. We wrote a full comparison on our Are We Dating the Same Girl page.",
  },
  {
    q: "How do you stop guys from posting fake or spiteful stories?",
    a: "Three layers. Every member passes a human-reviewed selfie check before they can post, so there are no throwaway accounts. Every story is read by a moderator before it publishes. And any story can be reported after the fact, which pulls it back for review.",
  },
  {
    q: "Can a woman ask for a post about her to be removed?",
    a: "Yes. Anyone — member or not — can request removal through our public dispute page. You don't need an account and you don't need to prove anything first; a moderator reviews every request.",
  },
  {
    q: "Do you use real names or photos of the women discussed?",
    a: "No. Stories use a first name and a city, nothing more. No last names, no photos of her, no social profiles, no contact details. That rule is enforced in moderation.",
  },
  {
    q: "Will anyone know it was me who posted?",
    a: "No. You post under a codename like @quietly_done. Your real name, your email and your selfie are never shown to other members.",
  },
  {
    q: "Who can join?",
    a: "Verified men. Signing up takes an email and a one-time selfie that a human reviews. There's no government ID, no phone number kept on file, and no invite code needed.",
  },
  {
    q: "What does Juice or Milk mean?",
    a: "Every story ends with one clear verdict: Juice is a green flag, Milk is a red flag. It means you get the answer at a glance instead of reading between the lines of a long post.",
  },
  {
    q: "Is it free?",
    a: "Yes. Joining, verification, searching and posting are all free.",
  },
];

const differences = [
  {
    title: "Real name vs codename",
    body: "A Facebook group post carries your profile. A Juice story carries a codename and nothing else.",
  },
  {
    title: "Volunteer admins vs human moderation",
    body: "Group admins approve members and hope for the best. Every Juice story is read before it publishes.",
  },
  {
    title: "A feed you scroll vs a name you search",
    body: "Groups bury old posts. On Juice you type a first name and a city and get what's there.",
  },
  {
    title: "Can be deleted vs built to last",
    body: "Social platforms remove these groups regularly. Juice is its own product with its own rules.",
  },
];

const MensGroupsFaq = () => {
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
            Men's dating groups,{" "}
            <span className="text-primary">answered straight.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl leading-relaxed">
            Why a Facebook group was never going to work for men, what a men's dating community
            has to get right instead, and how Juice handles verification, moderation and removals.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="xl" asChild className="font-bold">
              <Link to="/app">Join Juice free <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button size="xl" variant="outline" asChild>
              <Link to="/are-we-dating-the-same-girl">The men's version of AWDTSG</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 md:py-20 bg-secondary">
        <div className="max-w-6xl mx-auto">
          <div className="border-t-2 border-foreground pt-4 mb-10">
            <h2 className="font-display font-extrabold uppercase tracking-tight text-3xl md:text-4xl text-foreground">
              Four things a group can't do
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 md:gap-y-2">
            {differences.map((d, i) => (
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

      <section className="px-4 py-16 md:py-20">
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
          <p className="text-sm text-muted-foreground mt-8 max-w-3xl leading-relaxed">
            Still deciding? Read{" "}
            <Link to="/how-it-works" className="text-primary underline underline-offset-4">
              how Juice works
            </Link>
            , the{" "}
            <Link to="/tea-app-comparison" className="text-primary underline underline-offset-4">
              Tea app comparison
            </Link>
            , or request a removal on the{" "}
            <Link to="/dispute" className="text-primary underline underline-offset-4">
              dispute page
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="bg-foreground text-background">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <h2 className="font-display font-extrabold uppercase tracking-tight leading-[0.95] text-4xl md:text-6xl mb-4 max-w-3xl">
            No group required
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

export default MensGroupsFaq;
