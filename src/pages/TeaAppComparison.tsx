import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TeaAppComparison = () => {
  const navigate = useNavigate();

  const comparisons = [
    {
      feature: "Target Audience",
      original: "Women sharing dating experiences",
      ours: "Men sharing dating experiences",
      oursBetter: true
    },
    {
      feature: "Verification System",
      original: "Limited verification",
      ours: "Mandatory selfie verification",
      oursBetter: true
    },
    {
      feature: "Community Focus",
      original: "Mixed gender discussions",
      ours: "Men-only safe space",
      oursBetter: true
    },
    {
      feature: "Story Categories",
      original: "General dating stories",
      ours: "Structured rating system (4 metrics)",
      oursBetter: true
    },
    {
      feature: "Anonymity",
      original: "Basic anonymity",
      ours: "Complete anonymity with verification",
      oursBetter: true
    },
    {
      feature: "Content Moderation",
      original: "Community-driven",
      ours: "Professional moderation + community",
      oursBetter: true
    },
    {
      feature: "Story Depth",
      original: "Free-form posts",
      ours: "Structured 4-metric rating per experience",
      oursBetter: true
    },
    {
      feature: "User Safety",
      original: "Basic safety measures",
      ours: "Enhanced verification + reporting",
      oursBetter: true
    }
  ];

  const advantages = [
    {
      title: "Male-Centric Design",
      description: "Built specifically for men's communication styles and dating concerns",
      benefit: "More relevant advice and experiences"
    },
    {
      title: "Structured Reviews",
      description: "Rate dates on emotional safety, communication, loyalty, and overall vibe",
      benefit: "Actionable insights instead of just stories"
    },
    {
      title: "Verified Community",
      description: "Every member is verified to ensure authentic experiences",
      benefit: "Higher quality content and trustworthy advice"
    },
    {
      title: "No Drama Zone",
      description: "Men-only environment eliminates cross-gender dating politics",
      benefit: "Honest discussions without judgment"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Helmet>
        <title>Juice vs. Tea App — Anonymous Dating Reviews for Men</title>
        <meta name="description" content="See how Juice compares to Tea App — verified members, structured ratings, and full anonymity built specifically for men." />
        <link rel="canonical" href="https://thejuice.lovable.app/tea-app-comparison" />
        <meta property="og:title" content="Juice vs. Tea App — Anonymous Dating Reviews for Men" />
        <meta property="og:description" content="See how Juice compares to Tea App — built specifically for men." />
        <meta property="og:url" content="https://thejuice.lovable.app/tea-app-comparison" />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Juice vs. Tea App — A Side-by-Side Comparison
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Same concept — built properly for men. Here's what's different.
          </p>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Feature by Feature
            </h2>
            <p className="text-xl text-muted-foreground">
              Why verified men prefer Juice
            </p>
          </div>

          <Card className="border-0 shadow-card bg-white/80 backdrop-blur-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-juice-orange/10">
                    <th className="text-left p-4 font-semibold text-foreground">Feature</th>
                    <th className="text-left p-4 font-semibold text-muted-foreground">Tea App</th>
                    <th className="text-left p-4 font-semibold text-juice-orange">Juice</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisons.map((comparison, index) => (
                    <tr key={index} className="border-b border-juice-orange/5 hover:bg-juice-orange/5 transition-colors">
                      <td className="p-4 font-medium text-foreground">{comparison.feature}</td>
                      <td className="p-4 text-muted-foreground">{comparison.original}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="text-foreground">{comparison.ours}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </section>

      {/* Advantages Section */}
      <section className="py-16 px-4 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              What Only Juice Offers
            </h2>
            <p className="text-xl text-muted-foreground">
              What makes the difference
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {advantages.map((advantage, index) => (
              <Card key={index} className="border-0 shadow-card bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Check className="h-5 w-5 text-juice-orange" />
                    {advantage.title}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {advantage.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-juice-orange/10 p-4 rounded-lg">
                    <p className="text-sm font-medium text-juice-orange">
                      <strong>Benefit:</strong> {advantage.benefit}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              By the Numbers
            </h2>
            <p className="text-xl text-muted-foreground">
              Operational specifics from how Juice is built
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center border-0 shadow-card bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="text-4xl font-bold text-juice-orange mb-2">4</div>
                <div className="text-lg font-semibold text-foreground mb-2">Rating Metrics</div>
                <div className="text-sm text-muted-foreground">Every review covers communication, safety, vibe, and loyalty</div>
              </CardContent>
            </Card>
            
            <Card className="text-center border-0 shadow-card bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="text-4xl font-bold text-juice-orange mb-2">100%</div>
                <div className="text-lg font-semibold text-foreground mb-2">Manual Approval</div>
                <div className="text-sm text-muted-foreground">Every member is reviewed before joining — no auto sign-ups</div>
              </CardContent>
            </Card>
            
            <Card className="text-center border-0 shadow-card bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="text-4xl font-bold text-juice-orange mb-2">24h</div>
                <div className="text-lg font-semibold text-foreground mb-2">Verification Time</div>
                <div className="text-sm text-muted-foreground">Fast verification process to get you sharing quickly</div>
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
                One platform, built for how men actually date.
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Verified members. Anonymous stories. No drama from the other side of the equation.
              </p>
              <Button size="lg" variant="secondary" onClick={() => navigate("/app")} className="text-lg px-8">
                Request Access to Juice
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="text-sm mt-4 opacity-75">
                Free to join • Verified community • Anonymous sharing
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default TeaAppComparison;