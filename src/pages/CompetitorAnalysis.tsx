import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Target, Users, Zap, BarChart3, Search, Share2, Crown, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CompetitorAnalysis = () => {
  const navigate = useNavigate();

  const competitorGaps = [
    {
      title: "Women Have Tea App, Men Have Nothing",
      description: "The viral Tea app hit #1 with 4M+ women users, but zero options exist for men",
      icon: <Target className="h-8 w-8 text-primary" />,
      opportunity: "100% of male market untapped"
    },
    {
      title: "No Anonymous Male Reviews",
      description: "Men can't safely share dating experiences without social consequences",
      icon: <Users className="h-8 w-8 text-primary" />,
      opportunity: "Complete market gap for male perspectives"
    },
    {
      title: "Dating Apps Ignore Men's Needs",
      description: "Tinder, Bumble focus on matching, not real experience sharing",
      icon: <Search className="h-8 w-8 text-primary" />,
      opportunity: "First-mover advantage in male dating community"
    },
    {
      title: "Reddit Too Public & Toxic",
      description: "Men resort to public forums with no privacy or verification",
      icon: <Share2 className="h-8 w-8 text-primary" />,
      opportunity: "Safe, verified alternative needed"
    }
  ];

  const viralOpportunities = [
    {
      trigger: "Counter-narrative to viral Tea app",
      strategy: "Position as the male equivalent everyone's asking for",
      impact: "Tap into existing viral conversation"
    },
    {
      trigger: "Men feeling excluded from dating discourse",
      strategy: "Give men a voice in dating safety and reviews",
      impact: "Massive pent-up demand for male perspective"
    },
    {
      trigger: "Privacy concerns with women's Tea app",
      strategy: "Highlight better privacy and verification",
      impact: "Attract privacy-conscious users"
    }
  ];

  const marketStats = [
    { stat: "4M+", label: "Women using Tea app (reported)", subtext: "Zero male equivalent exists" },
    { stat: "#1", label: "Tea app ranking", subtext: "Proving demand for dating reviews" },
    { stat: "50M+", label: "Single men in US", subtext: "Completely underserved market" },
    { stat: "—", label: "Equivalent verified app for men", subtext: "Until Juice" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Juice vs. Tea App — The Male Dating Review Alternative</title>
        <meta name="description" content="Juice is the first verified, anonymous dating review platform built for men — where Tea App left a gap." />
        <link rel="canonical" href="https://sipjuice.app/competitor-analysis" />
        <meta property="og:title" content="Juice vs. Tea App — The Male Dating Review Alternative" />
        <meta property="og:description" content="Juice is the first verified, anonymous dating review platform built for men." />
        <meta property="og:url" content="https://sipjuice.app/competitor-analysis" />
        <meta property="og:type" content="website" />
      </Helmet>
      {/* Header */}

      <main>
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <TrendingUp className="w-4 h-4" />
            The category men have been left out of — until now
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Men finally have their own{" "}
            <span className="text-primary">
              dating review platform.
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Men have never had a verified, anonymous space to share dating experiences honestly. Juice changes that.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/app")} className="text-lg px-8">
              Request Access
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/how-it-works")} className="text-lg px-8">
              See How It Works
            </Button>
          </div>
        </div>
      </section>

      {/* Market Stats */}
      <section className="py-16 px-4 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">The Market Gap Is Real</h2>
            <p className="text-xl text-muted-foreground">Men have had no verified, anonymous space to share dating reviews</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {marketStats.map((item, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">{item.stat}</div>
                <div className="text-lg font-semibold text-foreground mb-1">{item.label}</div>
                <div className="text-sm text-muted-foreground">{item.subtext}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Competitor Gaps */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              What No Other Platform Offers
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We built what was missing.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {competitorGaps.map((gap, index) => (
              <Card key={index} className="border-0 shadow-card bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {gap.icon}
                    </div>
                    <CardTitle className="text-xl">{gap.title}</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    {gap.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-success/10 border border-green-200 rounded-lg p-3">
                    <p className="text-success font-semibold text-sm">
                      💰 Opportunity: {gap.opportunity}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Viral Strategy */}
      <section className="py-20 px-4 bg-white/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Juice Is Spreading
            </h2>
            <p className="text-xl text-muted-foreground">
              How the conversation is already shifting.
            </p>
          </div>
          
          <div className="space-y-6">
            {viralOpportunities.map((opportunity, index) => (
              <Card key={index} className="border-0 shadow-card bg-white/80">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">Trigger: {opportunity.trigger}</h3>
                      <p className="text-muted-foreground mb-3">Strategy: {opportunity.strategy}</p>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-blue-800 font-medium text-sm">
                          🎯 Impact: {opportunity.impact}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* First Mover Advantage */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
            First Mover Advantage = Everything
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center border-0 shadow-card bg-white/80">
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Market Timing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Men want a space like this. Juice is the only one built for them.
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-0 shadow-card bg-white/80">
              <CardHeader>
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Network Effects</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  First to market means we'll build the largest network, making us irreplaceable.
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-0 shadow-card bg-white/80">
              <CardHeader>
                <Crown className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Brand Dominance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We'll own the "Tea App for Men" category and all associated search traffic.
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
                Be among the first verified members
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Juice is the only verified, anonymous dating review platform built for men.
              </p>
              <Button size="lg" variant="secondary" onClick={() => navigate("/app")} className="text-lg px-8">
                Request Access
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
      </main>

      {/* SEO Footer */}
      <footer className="py-12 px-4 bg-white/80 border-t border-primary/10">
        <div className="max-w-4xl mx-auto text-center text-sm text-muted-foreground">
          <p>Juice vs Tea App | Men's Dating Reviews | Anonymous Male Dating Community</p>
          <p className="mt-2">&copy; 2024 Juice. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default CompetitorAnalysis;