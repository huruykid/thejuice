import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, Shield, MessageSquare, ArrowRight, Lightbulb, Heart, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const MensDatingAdvice = () => {
  const navigate = useNavigate();

  const adviceCategories = [
    {
      title: "First Date Tips",
      description: "Real advice from men who've been on hundreds of first dates",
      icon: <Heart className="h-6 w-6 text-juice-orange" />,
      topics: ["What to wear", "Conversation starters", "Where to go", "How to be confident"]
    },
    {
      title: "Dating App Strategy",
      description: "Proven strategies for Tinder, Bumble, Hinge and other apps",
      icon: <MessageSquare className="h-6 w-6 text-juice-orange" />,
      topics: ["Profile optimization", "Message templates", "Photo tips", "Getting matches"]
    },
    {
      title: "Red Flag Recognition",
      description: "Learn to spot warning signs early from men's experiences",
      icon: <AlertTriangle className="h-6 w-6 text-juice-orange" />,
      topics: ["Early warning signs", "Toxic behavior patterns", "When to walk away", "Trust your gut"]
    },
    {
      title: "Relationship Building",
      description: "How to build healthy, lasting relationships with women",
      icon: <Users className="h-6 w-6 text-juice-orange" />,
      topics: ["Communication skills", "Setting boundaries", "Building trust", "Long-term success"]
    }
  ];

  const quickTips = [
    "Be yourself - authenticity attracts the right person",
    "Listen more than you talk on first dates",
    "Don't ignore red flags for the sake of being nice",
    "Confidence comes from self-respect, not arrogance",
    "Quality connections matter more than quantity",
    "Set clear boundaries and stick to them"
  ];

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Helmet>
        <title>Men's Dating Advice from Real Guys</title>
        <meta name="description" content="Honest dating advice from experienced verified men. Practical tips on first dates, apps, red flags, and relationships." />
        <link rel="canonical" href="https://thejuice.lovable.app/mens-dating-advice" />
        <meta property="og:title" content="Men's Dating Advice from Real Guys" />
        <meta property="og:description" content="Honest dating advice from experienced verified men." />
        <meta property="og:url" content="https://thejuice.lovable.app/mens-dating-advice" />
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
            Get Advice Now
          </Button>
        </div>
      </header>

      <main>
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Real Dating Advice from{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Experienced Men
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Get honest, practical dating advice from thousands of men who've been in your shoes. Learn from real experiences, not theory.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/app")} className="text-lg px-8">
              Get Dating Advice
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/how-it-works")} className="text-lg px-8">
              How It Works
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Join 10,000+ men sharing real dating wisdom
          </p>
        </div>
      </section>

      {/* Quick Tips */}
      <section className="py-16 px-4 bg-white/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Lightbulb className="h-12 w-12 text-juice-orange mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-foreground mb-4">Quick Dating Tips from Men</h2>
            <p className="text-xl text-muted-foreground">
              Essential advice that every guy should know
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickTips.map((tip, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-white/80 rounded-lg shadow-card">
                <div className="w-6 h-6 bg-juice-orange rounded-full flex items-center justify-center text-white font-bold text-sm mt-0.5">
                  {index + 1}
                </div>
                <p className="text-foreground font-medium">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advice Categories */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Dating Advice Categories
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get specific advice for every stage of your dating journey
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {adviceCategories.map((category, index) => (
              <Card key={index} className="border-0 shadow-card bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-juice-orange/10 rounded-lg">
                      {category.icon}
                    </div>
                    <CardTitle className="text-xl">{category.title}</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    {category.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Learn about:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {category.topics.map((topic, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-juice-orange rounded-full"></div>
                          {topic}
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

      {/* Why Our Advice Works */}
      <section className="py-20 px-4 bg-white/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Our Dating Advice Actually Works
            </h2>
            <p className="text-xl text-muted-foreground">
              Real advice from real men, not pickup artists or theorists
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <Users className="h-12 w-12 text-juice-orange mx-auto" />
              <h3 className="text-xl font-semibold">Real Experiences</h3>
              <p className="text-muted-foreground">
                Advice comes from men who've actually been in relationships, not just theory
              </p>
            </div>
            <div className="text-center space-y-4">
              <Shield className="h-12 w-12 text-juice-orange mx-auto" />
              <h3 className="text-xl font-semibold">Anonymous Honesty</h3>
              <p className="text-muted-foreground">
                Men share brutally honest advice without worrying about judgment
              </p>
            </div>
            <div className="text-center space-y-4">
              <BookOpen className="h-12 w-12 text-juice-orange mx-auto" />
              <h3 className="text-xl font-semibold">Proven Results</h3>
              <p className="text-muted-foreground">
                Strategies that have actually worked for thousands of verified men
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories Preview */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Men Getting Real Results
            </h2>
            <p className="text-xl text-muted-foreground">
              See how our community's advice has helped men succeed in dating
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-card bg-white/80">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-juice-orange mb-2">85%</div>
                <p className="text-sm text-muted-foreground">
                  of men report improved dating confidence after joining
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-card bg-white/80">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-juice-orange mb-2">3x</div>
                <p className="text-sm text-muted-foreground">
                  more successful dates on average compared to before
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-card bg-white/80">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-juice-orange mb-2">92%</div>
                <p className="text-sm text-muted-foreground">
                  would recommend our advice to other men
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
                Ready to Get Better at Dating?
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Join thousands of men learning from real dating experiences and advice
              </p>
              <Button size="lg" variant="secondary" onClick={() => navigate("/app")} className="text-lg px-8">
                Get Dating Advice Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="text-sm mt-4 opacity-75">
                Free to join • Real advice from real men • Anonymous community
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
      </main>

      {/* SEO Footer */}
      <footer className="py-12 px-4 bg-white/80 border-t border-juice-orange/10">
        <div className="max-w-4xl mx-auto text-center text-sm text-muted-foreground">
          <p>Men's Dating Advice | Dating Tips for Men | Male Dating Guidance | Tea App for Men</p>
          <p className="mt-2">&copy; 2024 Tea App for Men. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default MensDatingAdvice;