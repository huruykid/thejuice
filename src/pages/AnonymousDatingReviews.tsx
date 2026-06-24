import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Shield, Users, MessageSquare, ArrowRight, Eye, Lock, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AnonymousDatingReviews = () => {
  const navigate = useNavigate();

  const reviewTypes = [
    {
      title: "Dating App Reviews",
      description: "Anonymous reviews of Tinder, Bumble, Hinge matches and conversations",
      icon: <MessageSquare className="h-6 w-6 text-juice-orange" />,
      examples: ["Tinder date reviews", "Bumble experience ratings", "Hinge conversation reviews"]
    },
    {
      title: "First Date Reviews",
      description: "Honest ratings and reviews of first date experiences",
      icon: <Star className="h-6 w-6 text-juice-orange" />,
      examples: ["Restaurant date reviews", "Activity date ratings", "Coffee date experiences"]
    },
    {
      title: "Relationship Reviews",
      description: "Anonymous reviews of dating relationships and partners",
      icon: <Users className="h-6 w-6 text-juice-orange" />,
      examples: ["Compatibility ratings", "Communication reviews", "Overall relationship scores"]
    },
    {
      title: "Hookup Reviews",
      description: "Anonymous reviews of casual dating and hookup experiences",
      icon: <Lock className="h-6 w-6 text-juice-orange" />,
      examples: ["Casual dating reviews", "Hookup experience ratings", "Safety and communication scores"]
    }
  ];

  const ratingCategories = [
    { category: "Communication", description: "How well did they communicate?" },
    { category: "Emotional Safety", description: "Did you feel emotionally safe?" },
    { category: "Overall Vibe", description: "What was the overall experience like?" },
    { category: "Loyalty", description: "Were they honest and trustworthy?" }
  ];

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Helmet>
        <title>Anonymous Dating Reviews from Verified Men | Juice</title>
        <meta name="description" content="Read anonymous date reviews from verified men. Rate first dates, apps, and relationships — your identity stays hidden." />
        <link rel="canonical" href="https://sipjuice.app/anonymous-dating-reviews" />
        <meta property="og:title" content="Anonymous Dating Reviews from Verified Men | Juice" />
        <meta property="og:description" content="Read anonymous date reviews from verified men — your identity stays hidden." />
        <meta property="og:url" content="https://sipjuice.app/anonymous-dating-reviews" />
        <meta property="og:type" content="website" />
      </Helmet>
      {/* Header */}

      <main>
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Anonymous Dating Reviews —{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Written by Verified Men
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Read honest date reviews from verified men. Write your own anonymously — no names, no trace.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/app")} className="text-lg px-8">
              Browse Verified Reviews
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/app")} className="text-lg px-8">
              Submit a Review
            </Button>
          </div>
        </div>
      </section>

      {/* Privacy Promise */}
      <section className="py-16 px-4 bg-white/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Shield className="h-16 w-16 text-juice-orange mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-foreground mb-4">Your identity never touches the review</h2>
            <p className="text-xl text-muted-foreground">
              Your identity is protected. Review with zero risk.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <Eye className="h-8 w-8 text-juice-orange mx-auto mb-3" />
              <h3 className="font-semibold mb-2">No Names Revealed</h3>
              <p className="text-sm text-muted-foreground">Reviews are completely anonymous - no personal information shared</p>
            </div>
            <div className="text-center">
              <Lock className="h-8 w-8 text-juice-orange mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Secure Platform</h3>
              <p className="text-sm text-muted-foreground">Advanced security keeps your reviews private and protected</p>
            </div>
            <div className="text-center">
              <CheckCircle className="h-8 w-8 text-juice-orange mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Verified Only</h3>
              <p className="text-sm text-muted-foreground">Only verified men can read and write reviews</p>
            </div>
          </div>
        </div>
      </section>

      {/* Review Types */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              What Men Review on Juice
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Rate and review all your dating experiences with complete anonymity
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {reviewTypes.map((type, index) => (
              <Card key={index} className="border-0 shadow-card bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-juice-orange/10 rounded-lg">
                      {type.icon}
                    </div>
                    <CardTitle className="text-xl">{type.title}</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    {type.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Examples:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {type.examples.map((example, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-juice-orange rounded-full"></div>
                          {example}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Rating System */}
      <section className="py-20 px-4 bg-white/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              4 Things Every Review Covers
            </h2>
            <p className="text-xl text-muted-foreground">
              Rate your experiences across these key areas
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ratingCategories.map((category, index) => (
              <div key={index} className="flex items-center gap-4 p-6 bg-white/80 rounded-lg shadow-card">
                <div className="flex-shrink-0">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-juice-orange fill-juice-orange" />
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{category.category}</h3>
                  <p className="text-muted-foreground">{category.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Anonymity Unlocks Honesty
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center border-0 shadow-card bg-white/80">
              <CardHeader>
                <MessageSquare className="h-12 w-12 text-juice-orange mx-auto mb-4" />
                <CardTitle>Honest Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Anonymity allows for brutally honest reviews without social consequences
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-0 shadow-card bg-white/80">
              <CardHeader>
                <Users className="h-12 w-12 text-juice-orange mx-auto mb-4" />
                <CardTitle>Help Other Men</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your anonymous reviews help other men make better dating decisions
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-0 shadow-card bg-white/80">
              <CardHeader>
                <Shield className="h-12 w-12 text-juice-orange mx-auto mb-4" />
                <CardTitle>No Retaliation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Complete anonymity means no worries about confrontation or backlash
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="border-0 shadow-card bg-gradient-primary text-white">
            <CardContent className="p-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                The most honest dating reviews you'll ever read
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Join a verified community of men sharing honest dating reviews.
              </p>
              <Button size="lg" variant="secondary" onClick={() => navigate("/app")} className="text-lg px-8">
                Browse Reviews
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="text-sm mt-4 opacity-75">
                Free to join • 100% anonymous • Verified men only
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
      </main>

      {/* SEO Footer */}
      <footer className="py-12 px-4 bg-white/80 border-t border-juice-orange/10">
        <div className="max-w-4xl mx-auto text-center text-sm text-muted-foreground">
          <p>Anonymous Dating Reviews | Men's Dating Ratings | Anonymous Dating Experiences | Juice</p>
          <p className="mt-2">&copy; 2024 Juice. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default AnonymousDatingReviews;