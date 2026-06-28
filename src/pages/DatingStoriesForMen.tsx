import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield, MessageSquare, Star, ArrowRight, Heart, ThumbsUp, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DatingStoriesForMen = () => {
  const navigate = useNavigate();

  const stats = [
    { icon: <Users className="h-8 w-8 text-primary" />, number: "Verified", label: "Members only" },
    { icon: <MessageSquare className="h-8 w-8 text-primary" />, number: "Anonymous", label: "Every story, every time" },
    { icon: <Eye className="h-8 w-8 text-primary" />, number: "100%", label: "Identity protected" },
    { icon: <Shield className="h-8 w-8 text-primary" />, number: "Manual", label: "Approval to join" }
  ];

  const storyTypes = [
    {
      title: "First Date Experiences",
      description: "Real stories about first dates - the good, bad, and everything in between",
      icon: <Heart className="h-6 w-6 text-primary" />
    },
    {
      title: "Relationship Reviews",
      description: "Honest ratings and reviews of dating experiences and relationships",
      icon: <Star className="h-6 w-6 text-primary" />
    },
    {
      title: "Dating App Stories",
      description: "Real experiences from Tinder, Bumble, Hinge and other dating platforms",
      icon: <MessageSquare className="h-6 w-6 text-primary" />
    },
    {
      title: "Red Flag Warnings",
      description: "Men sharing warning signs and red flags to help others avoid problems",
      icon: <Shield className="h-6 w-6 text-primary" />
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-soft">
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
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Dating Stories from{" "}
            <span className="text-primary">
              Verified Men — Anonymous & Unfiltered
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Read anonymous dating experiences from verified men. Honest, unrated by influencers, unsponsored.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/app")} className="text-lg px-8">
              Browse Stories
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/how-it-works")} className="text-lg px-8">
              See How It Works
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-foreground mb-2">{stat.number}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Types */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              What Men Share on Juice
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From first dates to long-term relationships - men share it all anonymously
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {storyTypes.map((type, index) => (
              <Card key={index} className="border-0 shadow-card bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {type.icon}
                    </div>
                    <CardTitle className="text-xl">{type.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {type.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-white/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
            Why Juice, Not Reddit or DMs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <Shield className="h-12 w-12 text-primary mx-auto" />
              <h3 className="text-xl font-semibold">100% Anonymous</h3>
              <p className="text-muted-foreground">Share your real experiences without revealing your identity. Complete privacy guaranteed.</p>
            </div>
            <div className="space-y-4">
              <Users className="h-12 w-12 text-primary mx-auto" />
              <h3 className="text-xl font-semibold">Men-Only Community</h3>
              <p className="text-muted-foreground">A space designed specifically for men to share honest dating experiences without judgment.</p>
            </div>
            <div className="space-y-4">
              <ThumbsUp className="h-12 w-12 text-primary mx-auto" />
              <h3 className="text-xl font-semibold">Verified Users</h3>
              <p className="text-muted-foreground">All stories come from verified men, ensuring authentic and trustworthy experiences.</p>
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
                The story you need is already in there.
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Join a verified community of men sharing authentic dating experiences.
              </p>
              <Button size="lg" variant="secondary" onClick={() => navigate("/app")} className="text-lg px-8">
                Browse Stories
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="text-sm mt-4 opacity-75">
                Free to join • Anonymous sharing • Verified community
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
      </main>

      {/* SEO Footer */}
    </div>
  );
};

export default DatingStoriesForMen;