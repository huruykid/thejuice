import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Users, Shield, MessageSquare, Star, ArrowRight, Quote } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
const Landing = () => {
  const navigate = useNavigate();
  const {
    user,
    loading
  } = useAuth();
  const [email, setEmail] = useState("");

  // Redirect authenticated users to the app
  useEffect(() => {
    if (!loading && user) {
      navigate("/app");
    }
  }, [user, loading, navigate]);
  const handleGetStarted = () => {
    navigate("/app");
  };
  const handleLearnMore = () => {
    navigate("/how-it-works");
  };
  const features = [{
    icon: <Shield className="h-6 w-6 text-juice-orange" />,
    title: "Anonymous & Verified",
    description: "Share stories without revealing your identity, but with verified accounts for authenticity."
  }, {
    icon: <Users className="h-6 w-6 text-juice-orange" />,
    title: "Men-Only Community",
    description: "Finally, a space where guys can be honest about dating without judgment."
  }, {
    icon: <MessageSquare className="h-6 w-6 text-juice-orange" />,
    title: "Rate Real Experiences",
    description: "Help other men make informed decisions with honest ratings and reviews."
  }, {
    icon: <Star className="h-6 w-6 text-juice-orange" />,
    title: "No Drama Zone",
    description: "Share the good, bad, and ugly without backlash or social consequences."
  }];
  const testimonials = [{
    quote: "Finally, an app where I can get honest dating advice from other guys who've been there.",
    author: "Mike, 28",
    rating: 5
  }, {
    quote: "The verification system makes all the difference. These are real stories from real men.",
    author: "James, 32",
    rating: 5
  }, {
    quote: "Wish I had this before my last relationship. The red flags were all there in other guys' stories.",
    author: "David, 26",
    rating: 5
  }];
  return <div className="min-h-screen bg-gradient-soft">
      <Helmet>
        <title>The Juice App — Anonymous Dating Stories for Men</title>
        <meta name="description" content="Verified men share anonymous dating stories, honest ratings, and real advice. Join 10,000+ guys keeping it real about modern dating." />
        <link rel="canonical" href="https://thejuice.lovable.app/" />
        <meta property="og:title" content="The Juice App — Anonymous Dating Stories for Men" />
        <meta property="og:description" content="Verified men share anonymous dating stories, honest ratings, and real advice." />
        <meta property="og:url" content="https://thejuice.lovable.app/" />
        <meta property="og:type" content="website" />
      </Helmet>
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-lg border-b border-juice-orange/10 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/lovable-uploads/cf8e88b6-e6aa-4e2a-b0da-abdcf3e4641f.png" alt="Tea App" className="h-8 w-8" />
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">The Juice App</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/blog")} className="hidden md:flex">
              Blog
            </Button>
            <Button onClick={() => navigate("/app")} variant="juice">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      <main>
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            The Tea App Every Guy Has Been{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Waiting For
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Share your dating stories anonymously, get verified insights, and connect with guys who actually get it. 
            No judgment, just real talk about modern dating.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="xl" onClick={handleGetStarted} variant="juice">
              Sign up now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="xl" onClick={() => window.open('https://instagram.com/sipjuiceapp', '_blank')}>
              Join the Brotherhood
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="xl" variant="outline" onClick={handleLearnMore}>
              How It Works
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Join 10,000+ men already sharing their stories
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why The Tea App for Men?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built specifically for men who want honest, authentic dating insights
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => <Card key={index} className="text-center border-0 shadow-card bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="mx-auto mb-4 p-3 bg-juice-orange/10 rounded-full w-fit">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground">
              Get started in minutes and join the conversation
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-juice-orange rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Verify Your Account</h3>
              <p className="text-muted-foreground">Quick selfie verification keeps the community authentic and trustworthy.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-juice-orange rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Share Your Story</h3>
              <p className="text-muted-foreground">Rate and review your dating experiences anonymously with complete privacy.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-juice-orange rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Read Real Tea</h3>
              <p className="text-muted-foreground">Get insights from verified men in your area and learn from their experiences.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              What Guys Are Saying
            </h2>
            <p className="text-xl text-muted-foreground">
              Real feedback from our verified community
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => <Card key={index} className="border-0 shadow-card bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <Quote className="h-8 w-8 text-juice-orange mb-4" />
                  <p className="text-foreground mb-4 italic">"{testimonial.quote}"</p>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{testimonial.author}</span>
                    <div className="flex">
                      {[...Array(testimonial.rating)].map((_, i) => <Star key={i} className="h-4 w-4 fill-juice-orange text-juice-orange" />)}
                    </div>
                  </div>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="border-0 shadow-card bg-gradient-primary text-white">
            <CardContent className="p-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Join the Community?
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Connect with verified men sharing real dating experiences in your area
              </p>
              <Button size="xl" variant="secondary" onClick={() => navigate("/app")}>
                Get Started Now
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

      {/* Footer */}
      <footer className="py-12 px-4 bg-white/80 border-t border-juice-orange/10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <img src="/lovable-uploads/cf8e88b6-e6aa-4e2a-b0da-abdcf3e4641f.png" alt="Tea App" className="h-6 w-6" />
                <span className="font-bold text-foreground">The Tea App for Men</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The dating community designed specifically for men to share honest experiences.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Features</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Anonymous Stories</li>
                <li>Verified Accounts</li>
                <li>Dating Reviews</li>
                <li>Men-Only Community</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/about" className="hover:text-juice-orange transition-colors">About Us</a></li>
                <li><a href="/how-it-works" className="hover:text-juice-orange transition-colors">How It Works</a></li>
                <li><a href="/privacy-policy" className="hover:text-juice-orange transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-juice-orange transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/help" className="hover:text-juice-orange transition-colors">Help Center</a></li>
                <li><a href="/support" className="hover:text-juice-orange transition-colors">Support</a></li>
                <li><a href="/safety" className="hover:text-juice-orange transition-colors">Safety Guidelines</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-juice-orange/10 mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 The Tea App for Men. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>;
};
export default Landing;