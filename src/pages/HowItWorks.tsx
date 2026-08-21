import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const HowItWorks = () => {
  const steps = [
    {
      number: 1,
      title: "Create Your Anonymous Profile",
      description: "Sign up with just an email and create your anonymous username. No real names required.",
      details: [
        "Choose a unique anonymous username",
        "Add basic info like age and city",
        "Set your relationship goals",
        "Complete privacy guaranteed"
      ]
    },
    {
      number: 2,
      title: "Verify Your Account",
      description: "Quick selfie verification ensures our community stays authentic and trustworthy.",
      details: [
        "Take a simple verification selfie",
        "Our team reviews within 24 hours",
        "Keeps fake accounts out",
        "Your selfie is never shared publicly"
      ]
    },
    {
      number: 3,
      title: "Share Your Dating Stories",
      description: "Rate and review your dating experiences with complete anonymity and honesty.",
      details: [
        "Rate dates on 4 key metrics",
        "Share detailed experiences",
        "Add photos (optional and anonymous)",
        "Help other men learn from your experiences"
      ]
    },
    {
      number: 4,
      title: "Read Real Insights",
      description: "Read genuine insights from verified men about their real dating experiences.",
      details: [
        "Browse verified stories by experience type",
        "Filter by ratings and experiences",
        "Learn from red flags others encountered",
        "Make better dating decisions"
      ]
    }
  ];

  const features = [
    {
      title: "100% Anonymous",
      description: "Your real identity is never revealed to other users"
    },
    {
      title: "Verified Community",
      description: "All members are verified to ensure authentic stories"
    },
    {
      title: "Honest Reviews",
      description: "Rate dates on communication, safety, and overall vibe"
    },
    {
      title: "Men-Only Space",
      description: "A judgment-free zone designed specifically for men"
    }
  ];

  const faqs = [
    {
      question: "Is my identity really anonymous?",
      answer: "Yes, completely. Your real name and photo are never shown to other users. Only your anonymous username and the stories you choose to share are visible to the community."
    },
    {
      question: "Why do you need verification?",
      answer: "Verification keeps fake accounts out. Every story you read comes from a real, manually approved member."
    },
    {
      question: "What happens to my verification photo?",
      answer: "Your verification selfie is used only for account verification and is never shared publicly or with other users. It's stored securely and only accessible to our verification team."
    },
    {
      question: "Can women join the app?",
      answer: "This platform is designed specifically for men to share their dating experiences in a judgment-free environment. We believe men deserve a space to be honest about their dating lives."
    }
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": "Is my identity really anonymous?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, completely. Your real name and photo are never shown to other users. Only your anonymous username and the stories you choose to share are visible to the community." } },
      { "@type": "Question", "name": "Why do you need verification?", "acceptedAnswer": { "@type": "Answer", "text": "Verification keeps fake accounts out. Every story you read comes from a real, manually approved member." } },
      { "@type": "Question", "name": "What happens to my verification photo?", "acceptedAnswer": { "@type": "Answer", "text": "Your verification selfie is used only for account verification and is never shared publicly or with other users. It's stored securely and only accessible to our verification team." } },
      { "@type": "Question", "name": "Can women join the app?", "acceptedAnswer": { "@type": "Answer", "text": "This platform is designed specifically for men to share their dating experiences in a judgment-free environment." } }
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>How Juice Works — Anonymous Dating Stories for Men</title>
        <meta name="description" content="Four steps: create an anonymous profile, verify, share the Juice, and read real experiences from verified men." />
        <link rel="canonical" href="https://sipjuice.app/how-it-works" />
        <meta property="og:title" content="How Juice Works" />
        <meta property="og:description" content="Four steps: create an anonymous profile, verify, share the Juice, and read real experiences from verified men." />
        <meta property="og:url" content="https://sipjuice.app/how-it-works" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <main>
        {/* Hero — type-led, left-aligned editorial masthead */}
        <section className="px-4 pt-14 pb-12 md:pt-20 md:pb-16">
          <div className="max-w-6xl mx-auto">
            <h1 className="font-display font-extrabold uppercase leading-[0.9] tracking-tight text-5xl md:text-7xl text-foreground mb-6 max-w-3xl">
              How <span className="text-primary">Juice</span> Works
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
              Four steps. Full anonymity. Verified men only.
            </p>
          </div>
        </section>

        {/* Steps — numbered editorial index with ruled detail lists */}
        <section className="px-4 py-12 md:py-16">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0 md:gap-y-4">
              {steps.map((step) => (
                <div key={step.number} className="border-t border-border py-8">
                  <span className="font-display font-extrabold text-5xl text-primary leading-none block mb-4" aria-hidden>
                    {String(step.number).padStart(2, "0")}
                  </span>
                  <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">{step.title}</h3>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-5">{step.description}</p>
                  <ul className="space-y-2 md:space-y-3">
                    {step.details.map((detail, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" aria-hidden />
                        <span className="text-sm text-muted-foreground">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features — numbered index on alternating background */}
        <section className="px-4 py-16 md:py-20 bg-secondary">
          <div className="max-w-6xl mx-auto">
            <div className="border-t-2 border-foreground pt-4 mb-10 flex items-baseline justify-between gap-4 flex-wrap">
              <h2 className="font-display font-extrabold uppercase tracking-tight text-3xl md:text-4xl text-foreground">
                What Makes Juice Different
              </h2>
              <p className="text-sm text-muted-foreground">
                Built specifically for authentic male experiences
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

        {/* FAQ — ruled list, no boxes */}
        <section className="px-4 py-16 md:py-20">
          <div className="max-w-6xl mx-auto">
            <div className="border-t-2 border-foreground pt-4 mb-8">
              <h2 className="font-display font-extrabold uppercase tracking-tight text-3xl md:text-4xl text-foreground">
                Common Questions
              </h2>
            </div>

            <div className="divide-y divide-border border-b border-border max-w-3xl">
              {faqs.map((faq, index) => (
                <div key={index} className="py-6">
                  <h3 className="font-bold text-foreground mb-2">{faq.question}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA — flat ink band */}
        <section className="bg-foreground text-background">
          <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
            <h2 className="font-display font-extrabold uppercase tracking-tight leading-[0.95] text-4xl md:text-6xl mb-4 max-w-3xl">
              Your story is safe here.
            </h2>
            <p className="text-lg text-background/70 mb-10 max-w-xl">
              Join a verified community of men sharing honest dating experiences.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <Button size="xl" asChild className="font-bold w-fit">
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

export default HowItWorks;
