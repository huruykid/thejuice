import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, MessageSquare, Eye, Users, CheckCircle, Star, ArrowRight, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HowItWorks = () => {
  const navigate = useNavigate();

  const steps = [
    {
      number: 1,
      title: "Create Your Anonymous Profile",
      description: "Sign up with just an email and create your anonymous username. No real names required.",
      icon: <Users className="h-8 w-8 text-juice-orange" />,
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
      icon: <Shield className="h-8 w-8 text-juice-orange" />,
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
      icon: <MessageSquare className="h-8 w-8 text-juice-orange" />,
      details: [
        "Rate dates on 4 key metrics",
        "Share detailed experiences",
        "Add photos (optional and anonymous)",
        "Help other guys learn from your experiences"
      ]
    },
    {
      number: 4,
      title: "Read Real Insights",
      description: "Get genuine insights from verified men in your area about their dating experiences.",
      icon: <Eye className="h-8 w-8 text-juice-orange" />,
      details: [
        "Browse stories by location",
        "Filter by ratings and experiences",
        "Learn from red flags others encountered",
        "Make better dating decisions"
      ]
    }
  ];

  const features = [
    {
      icon: <Shield className="h-6 w-6" />,
      title: "100% Anonymous",
      description: "Your real identity is never revealed to other users"
    },
    {
      icon: <CheckCircle className="h-6 w-6" />,
      title: "Verified Community",
      description: "All members are verified to ensure authentic stories"
    },
    {
      icon: <Star className="h-6 w-6" />,
      title: "Honest Reviews",
      description: "Rate dates on communication, safety, and overall vibe"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Men-Only Space",
      description: "A judgment-free zone designed specifically for men"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-lg border-b border-juice-orange/10 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/")}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <img src="/lovable-uploads/cf8e88b6-e6aa-4e2a-b0da-abdcf3e4641f.png" alt="Tea App" className="h-8 w-8" />
            <span className="text-lg md:text-xl font-bold bg-gradient-primary bg-clip-text text-transparent whitespace-nowrap">
              The Tea App for Men
            </span>
          </div>
          <Button onClick={() => navigate("/app")} variant="juice">
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            How The Tea App for Men Works
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            From signup to sharing stories, here's your complete guide to joining the most honest 
            men's dating community online.
          </p>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="space-y-16">
            {steps.map((step, index) => (
              <div key={step.number} className={`flex flex-col lg:flex-row items-center gap-12 ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                <div className="flex-1">
                  <Card className="border-0 shadow-card bg-white/80 backdrop-blur-sm">
                    <CardHeader className="text-center lg:text-left">
                      <div className="flex items-center justify-center lg:justify-start gap-4 mb-4">
                        <div className="w-12 h-12 bg-juice-orange rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {step.number}
                        </div>
                        {step.icon}
                      </div>
                      <CardTitle className="text-2xl mb-2">{step.title}</CardTitle>
                      <CardDescription className="text-lg">{step.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {step.details.map((detail, i) => (
                          <li key={i} className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-juice-orange flex-shrink-0" />
                            <span className="text-muted-foreground">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="flex-1 flex justify-center">
                  <div className="w-80 h-80 bg-gradient-primary rounded-3xl flex items-center justify-center">
                    <div className="text-white text-6xl">
                      {step.number === 1 && "👤"}
                      {step.number === 2 && "📸"}
                      {step.number === 3 && "📝"}
                      {step.number === 4 && "👀"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Men Choose Our Platform
            </h2>
            <p className="text-xl text-muted-foreground">
              Built specifically for authentic male experiences
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center border-0 shadow-card bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="mx-auto mb-4 p-3 bg-juice-orange/10 rounded-full w-fit text-juice-orange">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
          </div>
          
          <div className="space-y-6">
            <Card className="border-0 shadow-card bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Is my identity really anonymous?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes, completely. Your real name and photo are never shown to other users. Only your anonymous username and the stories you choose to share are visible to the community.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-card bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Why do you need verification?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Verification ensures our community consists of real men sharing authentic experiences. It helps prevent fake accounts and maintains the quality of stories and advice shared.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-card bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">What happens to my verification photo?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your verification selfie is used only for account verification and is never shared publicly or with other users. It's stored securely and only accessible to our verification team.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-card bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Can women join the app?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  This platform is designed specifically for men to share their dating experiences in a judgment-free environment. We believe men deserve a space to be honest about their dating lives.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="border-0 shadow-card bg-gradient-primary text-white">
            <CardContent className="p-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Share Your Story?
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Join thousands of verified men sharing honest dating experiences
              </p>
              <Button size="lg" variant="secondary" onClick={() => navigate("/app")} className="text-lg px-8">
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default HowItWorks;