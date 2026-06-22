import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Target, Users, Zap, BarChart3, Search, Share2, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CompetitorAnalysis = () => {
  const navigate = useNavigate();

  const competitorGaps = [
    {
      title: "Women Have Tea App, Men Have Nothing",
      description: "The viral Tea app hit #1 with 4M+ women users, but zero options exist for men",
      icon: <Target className="h-8 w-8 text-juice-orange" />,
      opportunity: "100% of male market untapped"
    },
    {
      title: "No Anonymous Male Reviews",
      description: "Men can't safely share dating experiences without social consequences",
      icon: <Users className="h-8 w-8 text-juice-orange" />,
      opportunity: "Complete market gap for male perspectives"
    },
    {
      title: "Dating Apps Ignore Men's Needs",
      description: "Tinder, Bumble focus on matching, not real experience sharing",
      icon: <Search className="h-8 w-8 text-juice-orange" />,
      opportunity: "First-mover advantage in male dating community"
    },
    {
      title: "Reddit Too Public & Toxic",
      description: "Men resort to public forums with no privacy or verification",
      icon: <Share2 className="h-8 w-8 text-juice-orange" />,
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
    { stat: "4M+", label: "Women using Tea app", subtext: "Zero male equivalent exists" },
    { stat: "#1", label: "Tea app ranking", subtext: "Proving demand for dating reviews" },
    { stat: "50M+", label: "Single men in US", subtext: "Completely underserved market" },
    { stat: "0", label: "Competing male apps", subtext: "Total blue ocean opportunity" }
  ];

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Helmet>
        <title>The Tea App Men Have Been Waiting For</title>
        <meta name="description" content="Women have Tea app — now men do too. Anonymous dating stories, reviews, and advice from verified men." />
        <link rel="canonical" href="https://thejuice.lovable.app/competitor-analysis" />
        <meta property="og:title" content="The Tea App Men Have Been Waiting For" />
        <meta property="og:description" content="Women have Tea app — now men do too." />
        <meta property="og:url" content="https://thejuice.lovable.app/competitor-analysis" />
        <meta property="og:type" content="website" />
      </Helmet>
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-lg border-b border-juice-orange/10 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/lovable-uploads/cf8e88b6-e6aa-4e2a-b0da-abdcf3e4641f.png" alt="Tea App for Men" className="h-8 w-8" />
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">Tea App for Men</span>
          </div>
          <Button onClick={() => navigate("/app")} variant="juice">
            Join the Revolution
          </Button>
        </div>
      </header>

      <main>
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-juice-orange/10 text-juice-orange px-4 py-2 rounded-full text-sm font-medium mb-6">
            <TrendingUp className="w-4 h-4" />
            VIRAL OPPORTUNITY: Women's Tea app hit #1 with 4M users
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Women Have Tea App.{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Now Men Do Too.
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            While women dominate dating discourse with the viral Tea app, men have been completely left out. Until now. 
            Finally, a platform where men can anonymously share dating experiences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/app")} className="text-lg px-8">
              Be Part of History
              <Crown className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/how-it-works")} className="text-lg px-8">
              Why Now?
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            First 10,000 men get founding member status
          </p>
        </div>
      </section>

      {/* Market Stats */}
      <section className="py-16 px-4 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">The Opportunity Is Massive</h2>
            <p className="text-xl text-muted-foreground">While women's Tea app explodes, men have zero options</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {marketStats.map((item, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-juice-orange mb-2">{item.stat}</div>
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
              Why The Competition Can't Touch Us
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We identified every gap in the market and built the perfect solution
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {competitorGaps.map((gap, index) => (
              <Card key={index} className="border-0 shadow-card bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-juice-orange/10 rounded-lg">
                      {gap.icon}
                    </div>
                    <CardTitle className="text-xl">{gap.title}</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    {gap.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-green-800 font-semibold text-sm">
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
            <Zap className="h-12 w-12 text-juice-orange mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Our Viral Growth Strategy
            </h2>
            <p className="text-xl text-muted-foreground">
              How we'll dominate the conversation and capture massive market share
            </p>
          </div>
          
          <div className="space-y-6">
            {viralOpportunities.map((opportunity, index) => (
              <Card key={index} className="border-0 shadow-card bg-white/80">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-juice-orange rounded-full flex items-center justify-center text-white font-bold text-sm">
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
                <BarChart3 className="h-12 w-12 text-juice-orange mx-auto mb-4" />
                <CardTitle>Market Timing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Tea app proves demand exists. We're perfectly positioned to capture the male market.
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-0 shadow-card bg-white/80">
              <CardHeader>
                <Users className="h-12 w-12 text-juice-orange mx-auto mb-4" />
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
                <Crown className="h-12 w-12 text-juice-orange mx-auto mb-4" />
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
                The Revolution Starts Now
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Be among the first 10,000 men to join the platform that will change everything
              </p>
              <Button size="lg" variant="secondary" onClick={() => navigate("/app")} className="text-lg px-8">
                Join the Revolution
                <Crown className="ml-2 h-5 w-5" />
              </Button>
              <p className="text-sm mt-4 opacity-75">
                Founding members get exclusive perks • Limited time only
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
      </main>

      {/* SEO Footer */}
      <footer className="py-12 px-4 bg-white/80 border-t border-juice-orange/10">
        <div className="max-w-4xl mx-auto text-center text-sm text-muted-foreground">
          <p>Tea App for Men | Male Tea App | Men's Dating Reviews | Anonymous Male Dating Community</p>
          <p className="mt-2">&copy; 2024 Tea App for Men. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default CompetitorAnalysis;