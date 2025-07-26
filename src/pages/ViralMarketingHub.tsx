import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { 
  Zap, 
  TrendingUp, 
  Target, 
  Search, 
  Share2, 
  BarChart3, 
  FileText,
  Loader2,
  Copy,
  Download
} from "lucide-react";

const ViralMarketingHub = () => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [competitiveAnalysis, setCompetitiveAnalysis] = useState('');
  
  // Content generation state
  const [contentPrompt, setContentPrompt] = useState('');
  const [contentType, setContentType] = useState('blog');
  const [keywords, setKeywords] = useState('tea app for men, male dating stories, anonymous dating reviews');
  const [targetAudience, setTargetAudience] = useState('men 18-35');

  // Analysis state
  const [analysisType, setAnalysisType] = useState('seo');
  const [competitors, setCompetitors] = useState('tea app, dating apps, reddit dating');
  const [targetKeywordsList, setTargetKeywordsList] = useState('tea app for men, male dating stories, men dating advice');

  const generateViralContent = async () => {
    if (!contentPrompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a content prompt",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('viral-content-generator', {
        body: {
          prompt: contentPrompt,
          contentType,
          keywords,
          targetAudience
        }
      });

      if (error) throw error;

      setGeneratedContent(data.content);
      toast({
        title: "Success!",
        description: `Viral ${contentType} content generated successfully`,
      });
    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: "Error",
        description: "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const runCompetitiveAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const competitorList = competitors.split(',').map(c => c.trim());
      const keywordList = targetKeywordsList.split(',').map(k => k.trim());

      const { data, error } = await supabase.functions.invoke('competitive-analysis', {
        body: {
          competitors: competitorList,
          targetKeywords: keywordList,
          analysisType
        }
      });

      if (error) throw error;

      setCompetitiveAnalysis(data.analysis);
      toast({
        title: "Analysis Complete!",
        description: `${analysisType.toUpperCase()} competitive analysis generated`,
      });
    } catch (error) {
      console.error('Error running analysis:', error);
      toast({
        title: "Error",
        description: "Failed to run competitive analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Content copied to clipboard",
    });
  };

  const downloadContent = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-soft p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            🚀 Viral Marketing Hub
          </h1>
          <p className="text-xl text-muted-foreground">
            AI-powered tools to crush the competition and dominate search rankings
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center">
            <CardContent className="p-4">
              <TrendingUp className="h-8 w-8 text-juice-orange mx-auto mb-2" />
              <div className="text-2xl font-bold">4M+</div>
              <div className="text-sm text-muted-foreground">Women using Tea app</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <Target className="h-8 w-8 text-juice-orange mx-auto mb-2" />
              <div className="text-2xl font-bold">0</div>
              <div className="text-sm text-muted-foreground">Competing male apps</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <Search className="h-8 w-8 text-juice-orange mx-auto mb-2" />
              <div className="text-2xl font-bold">50M+</div>
              <div className="text-sm text-muted-foreground">Untapped male market</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <Zap className="h-8 w-8 text-juice-orange mx-auto mb-2" />
              <div className="text-2xl font-bold">100%</div>
              <div className="text-sm text-muted-foreground">Blue ocean opportunity</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="content">Viral Content Generator</TabsTrigger>
            <TabsTrigger value="analysis">Competitive Analysis</TabsTrigger>
          </TabsList>

          {/* Content Generation Tab */}
          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  AI Viral Content Generator
                </CardTitle>
                <CardDescription>
                  Generate viral content that will crush the competition and drive massive traffic
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Content Type</label>
                    <Select value={contentType} onValueChange={setContentType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blog">Blog Post (SEO)</SelectItem>
                        <SelectItem value="social">Social Media</SelectItem>
                        <SelectItem value="press">Press Release</SelectItem>
                        <SelectItem value="email">Email Campaign</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Target Audience</label>
                    <Input
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      placeholder="e.g., men 18-35"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Target Keywords</label>
                  <Input
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="tea app for men, male dating stories, anonymous dating reviews"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Content Prompt</label>
                  <Textarea
                    value={contentPrompt}
                    onChange={(e) => setContentPrompt(e.target.value)}
                    placeholder="e.g., Why men need their own version of the viral Tea app"
                    rows={3}
                  />
                </div>

                <Button 
                  onClick={generateViralContent} 
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Viral Content...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Generate Viral Content
                    </>
                  )}
                </Button>

                {generatedContent && (
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        Generated Content
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(generatedContent)}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadContent(generatedContent, 'viral-content.txt')}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-sm">{generatedContent}</pre>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Competitive Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  AI Competitive Analysis
                </CardTitle>
                <CardDescription>
                  Analyze competitors and identify opportunities to dominate the market
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Analysis Type</label>
                    <Select value={analysisType} onValueChange={setAnalysisType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="seo">SEO Analysis</SelectItem>
                        <SelectItem value="content">Content Strategy</SelectItem>
                        <SelectItem value="viral">Viral Marketing</SelectItem>
                        <SelectItem value="market">Market Research</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Target Keywords</label>
                    <Input
                      value={targetKeywordsList}
                      onChange={(e) => setTargetKeywordsList(e.target.value)}
                      placeholder="tea app for men, male dating stories"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Competitors (comma-separated)</label>
                  <Input
                    value={competitors}
                    onChange={(e) => setCompetitors(e.target.value)}
                    placeholder="tea app, dating apps, reddit dating"
                  />
                </div>

                <Button 
                  onClick={runCompetitiveAnalysis} 
                  disabled={isAnalyzing}
                  className="w-full"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running Analysis...
                    </>
                  ) : (
                    <>
                      <Target className="mr-2 h-4 w-4" />
                      Run Competitive Analysis
                    </>
                  )}
                </Button>

                {competitiveAnalysis && (
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        Competitive Analysis Results
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(competitiveAnalysis)}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadContent(competitiveAnalysis, 'competitive-analysis.txt')}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-sm">{competitiveAnalysis}</pre>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>🎯 Quick Viral Strategies</CardTitle>
            <CardDescription>
              Pre-built strategies to implement immediately
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Badge variant="outline" className="p-3 text-center">
                <Share2 className="h-4 w-4 mr-2" />
                Counter-narrative to womens Tea app
              </Badge>
              <Badge variant="outline" className="p-3 text-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                First-mover male dating community
              </Badge>
              <Badge variant="outline" className="p-3 text-center">
                <Target className="h-4 w-4 mr-2" />
                50M+ untapped male market
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ViralMarketingHub;