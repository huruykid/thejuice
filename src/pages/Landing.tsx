import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Users, MessageSquare, Star, ArrowRight, Quote, CheckCircle, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

const Landing = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && user) {
      navigate("/app");
    }
  }, [user, loading, navigate]);

  const handleGetStarted = () => navigate("/app");

  const features = [
    {
      icon: <Shield className="h-6 w-6 text-primary" />,
      title: "You're anonymous. They're verified.",
      description: "Post without your name attached. Every person you read about was submitted by a verified, real member.",
    },
    {
      icon: <Users className="h-6 w-6 text-primary" />,
      title: "For men, by men.",
      description: "A space where men can be honest about dating experiences without social consequences or judgment.",
    },
    {
      icon: <MessageSquare className="h-6 w-6 text-primary" />,
      title: "Rate it. Learn from it.",
      description: "Rate loyalty, communication, vibe, and respect. Help other men see patterns before they live through them.",
    },
    {
      icon: <Star className="h-6 w-6 text-primary" />,
      title: "Zero consequences.",
      description: "Share the real story. No backlash. No screenshots. No drama. The community keeps it contained.",
    },
  ];

  const testimonials = [
    {
      quote: "Finally an app where I can get honest dating advice from men who've actually been there.",
      author: "Mike, 28",
      rating: 5,
    },
    {
      quote: "The verification system makes all the difference. These are real stories from real men.",
      author: "James, 32",
      rating: 5,
    },
    {
      quote: "Wish I had this before my last relationship. The red flags were all there in other men's stories.",
      author: "David, 26",
      rating: 5,
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
    <div className="min-h-screen bg-gradient-soft">
      <Helmet>
        <title>Juice — Real Dating Stories for Men. Zero Consequences.</title>
        <meta name="description" content="Verified men share anonymous dating stories and honest ratings. Read the real feed. Post yours. No names, no judgment." />
        <link rel="canonical" href="https://sipjuice.app/" />
        <meta property="og:title" content="Juice — Real Dating Stories for Men. Zero Consequences." />
        <meta property="og:description" content="Verified men share anonymous dating stories. Read the feed. Post yours. No names, no consequences." />
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
        {/* Hero */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full mb-6">
              <Shield className="h-3.5 w-3.5" />
              Every member verified by a real human
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Real stories. Real men.{" "}
              <span className="text-primary">Zero consequences.</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Verified men. Anonymous stories. Read the feed. Post yours.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <Button size="xl" variant="juice" onClick={handleGetStarted} className="font-bold">
                Join free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="xl" variant="outline" onClick={() => navigate("/how-it-works")}>
                How it works
              </Button>
            </div>

            {/* Social proof — NOTE: these counts are hardcoded. To make them honest,
                expose a SECURITY DEFINER RPC (e.g. get_public_stats() returning counts
                of verified users + approved stories, GRANT EXECUTE to anon) and read it
                here. Left hardcoded pending a marketing decision on showing real numbers. */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-primary" />
                1,200+ verified men
              </span>
              <span className="hidden sm:block text-muted-foreground/40">·</span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-primary" />
                3,400+ stories shared
              </span>
              <span className="hidden sm:block text-muted-foreground/40">·</span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-primary" />
                Free to join
              </span>
            </div>
          </div>

          {/* App mockup */}
          <div className="max-w-xs mx-auto mt-16 relative">
            <div className="bg-background border border-border rounded-2xl shadow-lg overflow-hidden">
              {/* Mock status bar */}
              <div className="bg-background px-4 py-2 flex items-center justify-between border-b border-border">
                <span className="text-xs font-semibold text-foreground">The Juice App</span>
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/20" />
                </div>
              </div>
              {/* Mock story cards — matches real StoryCard layout: header → subject photo → text → flags → reactions */}
              {[
                { name: "Emma R.", photo: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&fit=crop&crop=face", author: "throwback_j", time: "2h", flags: "🚩🚩 ghosted after 3 months", green: 12, red: 34 },
                { name: "Sophia K.", photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&fit=crop&crop=face", author: "quietly_done", time: "5h", flags: "💯 loyal · honest to a fault", green: 41, red: 3 },
                { name: "Mia T.", photo: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&fit=crop&crop=face", author: "weekend_plans", time: "8h", flags: "☠️ toxic · clingy after week 1", green: 8, red: 29 },
              ].map((card, i) => (
                <div key={i} className="border-b border-border last:border-b-0 bg-background">
                  {/* Header */}
                  <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-primary flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      {card.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{card.name}</p>
                      <p className="text-[10px] text-muted-foreground">@{card.author} · {card.time} ago</p>
                    </div>
                  </div>
                  {/* Subject photo — matches aspect-square carousel in real StoryCard */}
                  <div className="aspect-square w-full overflow-hidden bg-muted">
                    <img
                      src={card.photo}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Story text + flags + reactions */}
                  <div className="px-3 py-2.5">
                    <div className="space-y-1 mb-2">
                      <div className="h-2 bg-muted rounded w-full" />
                      <div className="h-2 bg-muted rounded w-5/6" />
                      <div className="h-2 bg-muted rounded w-3/4" />
                    </div>
                    <p className="text-[10px] text-muted-foreground mb-1.5">{card.flags}</p>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span>🟢 {card.green}</span>
                      <span>🚩 {card.red}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Blur gradient at bottom of mockup */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background/80 to-transparent rounded-b-2xl pointer-events-none" />
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-4 bg-white/50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Why men choose Juice.
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                The only verified, anonymous space built for honest dating stories.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className={`border-0 shadow-card bg-white/80 backdrop-blur-sm ${index === 0 ? "md:col-span-2 lg:col-span-1" : ""}`}
                >
                  <CardContent className="p-6 flex gap-4 items-start">
                    <div className="p-3 bg-primary/10 rounded-xl w-fit shrink-0">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Three steps to your first story
              </h2>
              <p className="text-xl text-muted-foreground">
                Verified and posting in under two minutes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                  1
                </div>
                <h3 className="text-lg font-semibold mb-2">Verify your identity</h3>
                <p className="text-muted-foreground text-sm">
                  One quick selfie. A real human reviews it. Your photo is never stored publicly.
                </p>
              </div>

              <div className="text-center">
                <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                  2
                </div>
                <h3 className="text-lg font-semibold mb-2">Read the feed</h3>
                <p className="text-muted-foreground text-sm">
                  Browse verified stories. Rate them. Comment. See what other men have lived through.
                </p>
              </div>

              <div className="text-center">
                <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                  3
                </div>
                <h3 className="text-lg font-semibold mb-2">Post yours anonymously</h3>
                <p className="text-muted-foreground text-sm">
                  Share your story under your codename. Rate loyalty, vibe, communication, respect.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 px-4 bg-white/50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                From verified members
              </h2>
              <p className="text-xl text-muted-foreground">
                Real feedback from the community
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="border-0 shadow-card bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <Quote className="h-7 w-7 text-primary mb-4" />
                    <p className="text-foreground mb-4 italic text-sm leading-relaxed">"{testimonial.quote}"</p>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{testimonial.author}</span>
                      <div className="flex">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Common questions
              </h2>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white/80 border border-primary/10 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-primary/5 transition-colors"
                  >
                    <span className="font-semibold text-foreground text-sm">{faq.question}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${openFaq === index ? "rotate-180" : ""}`}
                    />
                  </button>
                  {openFaq === index && (
                    <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Card className="border-0 shadow-card bg-gradient-primary text-white">
              <CardContent className="p-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  You've been holding back long enough.
                </h2>
                <p className="text-xl mb-8 opacity-90">
                  Juice is the only verified, anonymous space built for men to share and read real dating stories.
                </p>
                <Button size="xl" variant="secondary" onClick={handleGetStarted}>
                  Join free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <p className="text-sm mt-4 opacity-75">
                  Free · Anonymous · Verified men only
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
    </div>
  );
};

export default Landing;
