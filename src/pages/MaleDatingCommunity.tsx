import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield, MessageSquare, Heart, ArrowRight, CheckCircle, Globe, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const MaleDatingCommunity = () => {
  const navigate = useNavigate();

  const communityFeatures = [
    {
      title: "Anonymous Sharing",
      description: "Share your dating experiences without revealing your identity",
      icon: <Lock className="h-6 w-6 text-juice-orange" />,
      benefits: ["Complete privacy", "No judgment", "Safe environment", "Real conversations"]
    },
    {
      title: "Verified Men Only",
      description: "Community exclusively for verified male members",
      icon: <Shield className="h-6 w-6 text-juice-orange" />,
      benefits: ["Authentic stories", "Real experiences", "Trusted community", "No fake profiles"]
    },
    {
      title: "Global Community",
      description: "Connect with men from around the world sharing similar experiences",
      icon: <Globe className="h-6 w-6 text-juice-orange" />,
      benefits: ["Diverse perspectives", "Cultural insights", "Worldwide support", "24/7 activity"]
    },
    {
      title: "Supportive Environment",
      description: "A judgment-free zone where men support each other",
      icon: <Heart className="h-6 w-6 text-juice-orange" />,
      benefits: ["No toxic masculinity", "Emotional support", "Constructive advice", "Brotherhood"]
    }
  ];

  const communityStats = [
    { number: "10,000+", label: "Active Members", description: "Verified men sharing experiences" },
    { number: "50,000+", label: "Stories Shared", description: "Real dating experiences posted" },
    { number: "500+", label: "Daily Interactions", description: "Comments, reactions, and discussions" },
    { number: "24/7", label: "Community Support", description: "Always someone online to help" }
  ];

  const whatMenShare = [
    "First date experiences and advice",
    "Dating app success and failure stories",
    "Relationship lessons learned",
    "Red flags and warning signs",
    "Confidence building tips",
    "Communication strategies that work"
  ];

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Helmet>
        <title>Male Dating Community — Verified Men Only</title>
        <meta name="description" content="Join the largest anonymous male dating community. Verified men share stories, advice, and experiences in a judgment-free space." />
        <link rel="canonical" href="https://thejuice.lovable.app/male-dating-community" />
        <meta property="og:title" content="Male Dating Community — Verified Men Only" />
        <meta property="og:description" content="Anonymous male dating community for verified men only." />
        <meta property="og:url" content="https://thejuice.lovable.app/male-dating-community" />
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
            Join Community
          </Button>
        </div>
      </header>

      <main>
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            The Largest Male Dating{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Community Online
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Connect with thousands of verified men sharing real dating stories, advice, and experiences. A judgment-free community where guys actually help each other.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/app")} className="text-lg px-8">
              Join the Community
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/how-it-works")} className="text-lg px-8">
              Learn More
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Free to join • Verified men only • 100% anonymous
          </p>
        </div>
      </section>

      {/* Community Stats */}
      <section className="py-16 px-4 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Our Growing Community</h2>
            <p className="text-xl text-muted-foreground">Real numbers from real men making real connections</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {communityStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-juice-orange mb-2">{stat.number}</div>
                <div className="text-lg font-semibold text-foreground mb-1">{stat.label}</div>
                <div className="text-sm text-muted-foreground">{stat.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Men Choose Our Community
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The features that make our community different from all the rest
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {communityFeatures.map((feature, index) => (
              <Card key={index} className="border-0 shadow-card bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-juice-orange/10 rounded-lg">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Benefits:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {feature.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-juice-orange flex-shrink-0" />
                          {benefit}
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

      {/* What Men Share */}
      <section className="py-20 px-4 bg-white/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              What Men Share in Our Community
            </h2>
            <p className="text-xl text-muted-foreground">
              Real topics from real men helping each other succeed in dating
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {whatMenShare.map((topic, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-white/80 rounded-lg shadow-card">
                <MessageSquare className="w-5 h-5 text-juice-orange flex-shrink-0 mt-0.5" />
                <p className="text-foreground font-medium">{topic}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Guidelines */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Our Community Standards
            </h2>
            <p className="text-xl text-muted-foreground">
              What makes our community a safe and supportive space for all men
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center border-0 shadow-card bg-white/80">
              <CardHeader>
                <Shield className="h-12 w-12 text-juice-orange mx-auto mb-4" />
                <CardTitle>Respect & Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We maintain a supportive environment where men can share vulnerably without fear of judgment
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-0 shadow-card bg-white/80">
              <CardHeader>
                <Users className="h-12 w-12 text-juice-orange mx-auto mb-4" />
                <CardTitle>Constructive Dialogue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  All discussions focus on helping each other grow and succeed in healthy relationships
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-0 shadow-card bg-white/80">
              <CardHeader>
                <Lock className="h-12 w-12 text-juice-orange mx-auto mb-4" />
                <CardTitle>Privacy Protection</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Strict anonymity rules ensure your personal information and stories stay private
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Join CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="border-0 shadow-card bg-gradient-primary text-white">
            <CardContent className="p-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Join the Brotherhood?
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Connect with thousands of men who understand your dating journey
              </p>
              <Button size="lg" variant="secondary" onClick={() => navigate("/app")} className="text-lg px-8">
                Join the Community Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="text-sm mt-4 opacity-75">
                Free forever • Verified men only • Anonymous and safe
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
      </main>

      {/* SEO Footer */}
      <footer className="py-12 px-4 bg-white/80 border-t border-juice-orange/10">
        <div className="max-w-4xl mx-auto text-center text-sm text-muted-foreground">
          <p>Male Dating Community | Men's Dating Support | Anonymous Male Community | Tea App for Men</p>
          <p className="mt-2">&copy; 2024 Tea App for Men. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default MaleDatingCommunity;