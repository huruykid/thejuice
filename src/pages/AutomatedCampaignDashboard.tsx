import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { 
  Zap, 
  TrendingUp, 
  Target, 
  Bot, 
  Play, 
  Pause,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  Crown,
  Rocket
} from "lucide-react";

const AutomatedCampaignDashboard = () => {
  const { toast } = useToast();
  const [isAutomationActive, setIsAutomationActive] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [campaignData, setCampaignData] = useState<any>(null);
  const [monitoringData, setMonitoringData] = useState<any>(null);

  // Auto-start monitoring on component mount
  useEffect(() => {
    console.log('AutomatedCampaignDashboard mounted, starting monitoring...');
    startAutomaticMonitoring();
  }, []);

  const generateAutomatedCampaign = async (type: string = 'domination') => {
    console.log(`Starting campaign generation for type: ${type}`);
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('automated-campaign-generator', {
        body: {
          campaignType: type,
          duration: '30-days',
          intensity: 'aggressive'
        }
      });

      if (error) throw error;

      setCampaignData(data);
      setIsAutomationActive(true);
      
      toast({
        title: "🚀 AUTOMATION ACTIVATED!",
        description: `${type} campaign is now running on autopilot`,
      });
    } catch (error) {
      console.error('Error generating campaign:', error);
      toast({
        title: "Error",
        description: "Failed to generate automated campaign",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const startAutomaticMonitoring = async () => {
    console.log('Starting automatic monitoring...');
    setIsMonitoring(true);
    try {
      const { data, error } = await supabase.functions.invoke('competitive-monitoring', {
        body: {
          monitoringType: 'comprehensive',
          alertThreshold: 'medium',
          autoResponse: true
        }
      });

      if (error) throw error;

      setMonitoringData(data);
      
      toast({
        title: "📊 MONITORING ACTIVE",
        description: "Competitive intelligence running 24/7",
      });
    } catch (error) {
      console.error('Error starting monitoring:', error);
      toast({
        title: "Warning",
        description: "Monitoring system needs attention",
        variant: "destructive",
      });
    } finally {
      setIsMonitoring(false);
    }
  };

  const automationStats = [
    { 
      label: "Campaign Status", 
      value: isAutomationActive ? "ACTIVE" : "READY", 
      icon: isAutomationActive ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Clock className="h-5 w-5 text-orange-500" />
    },
    { 
      label: "Monitoring", 
      value: "24/7 LIVE", 
      icon: <Target className="h-5 w-5 text-blue-500" />
    },
    { 
      label: "Market Opportunity", 
      value: "100% BLUE OCEAN", 
      icon: <TrendingUp className="h-5 w-5 text-green-500" />
    },
    { 
      label: "Competition", 
      value: "ZERO MALE APPS", 
      icon: <Crown className="h-5 w-5 text-juice-orange" />
    }
  ];

  const quickLaunchCampaigns = [
    {
      type: 'domination',
      title: '🔥 Market Domination',
      description: '30-day campaign to capture 100K+ users and dominate search rankings',
      intensity: 'AGGRESSIVE'
    },
    {
      type: 'launch',
      title: '🚀 Explosive Launch',
      description: '7-day campaign designed to break the internet and go viral',
      intensity: 'NUCLEAR'
    },
    {
      type: 'ongoing',
      title: '⚡ Perpetual Engine',
      description: 'Self-sustaining viral content machine that runs forever',
      intensity: 'AUTOPILOT'
    }
  ];

  console.log('AutomatedCampaignDashboard rendering...', { isAutomationActive, isGenerating, isMonitoring });

  return (
    <div className="min-h-screen bg-gradient-soft p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-juice-orange/10 text-juice-orange px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Bot className="w-4 h-4" />
            FULLY AUTOMATED MARKETING MACHINE
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            🤖 Autopilot Campaign Dashboard
          </h1>
          <p className="text-xl text-muted-foreground">
            Sit back and watch as AI dominates the competition for you
          </p>
        </div>

        {/* Automation Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {automationStats.map((stat, index) => (
            <Card key={index} className="text-center">
              <CardContent className="p-4">
                <div className="flex items-center justify-center mb-2">
                  {stat.icon}
                </div>
                <div className="text-lg font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Alert Banner */}
        <Card className="mb-8 border-juice-orange bg-juice-orange/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-juice-orange" />
              <div>
                <div className="font-semibold text-juice-orange">MASSIVE OPPORTUNITY DETECTED</div>
                <div className="text-sm text-muted-foreground">
                  Women's Tea app has 4M+ users, but ZERO male alternatives exist. Strike now!
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="campaigns" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="campaigns">🚀 Launch Campaigns</TabsTrigger>
            <TabsTrigger value="monitoring">📊 Live Monitoring</TabsTrigger>
            <TabsTrigger value="results">📈 Automation Results</TabsTrigger>
          </TabsList>

          {/* Campaign Launcher */}
          <TabsContent value="campaigns" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="h-5 w-5" />
                  One-Click Campaign Deployment
                </CardTitle>
                <CardDescription>
                  Choose your automated campaign and watch it dominate the competition
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {quickLaunchCampaigns.map((campaign, index) => (
                    <Card key={index} className="border-2 hover:border-juice-orange transition-colors">
                      <CardHeader>
                        <CardTitle className="text-lg">{campaign.title}</CardTitle>
                        <Badge variant="outline" className="w-fit">
                          {campaign.intensity}
                        </Badge>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          {campaign.description}
                        </p>
                        <Button
                          onClick={() => generateAutomatedCampaign(campaign.type)}
                          disabled={isGenerating}
                          className="w-full"
                          variant={campaign.type === 'domination' ? 'default' : 'outline'}
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Deploying...
                            </>
                          ) : (
                            <>
                              <Play className="mr-2 h-4 w-4" />
                              Deploy Now
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Active Campaign Display */}
                {campaignData && (
                  <Card className="mt-6 border-green-200 bg-green-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-800">
                        <CheckCircle className="h-5 w-5" />
                        Campaign Active: Running on Autopilot
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Target:</strong> {campaignData.automation?.keyMetrics?.targetSignups}
                        </div>
                        <div>
                          <strong>SEO Goal:</strong> {campaignData.automation?.keyMetrics?.targetRankings}
                        </div>
                        <div>
                          <strong>Traffic Goal:</strong> {campaignData.automation?.keyMetrics?.targetTraffic}
                        </div>
                        <div>
                          <strong>Social Goal:</strong> {campaignData.automation?.keyMetrics?.targetSocial}
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-white rounded border">
                        <div className="text-xs text-muted-foreground mb-2">Next Actions (Automated):</div>
                        <ul className="text-xs space-y-1">
                          {campaignData.nextActions?.map((action: string, i: number) => (
                            <li key={i} className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Live Monitoring */}
          <TabsContent value="monitoring" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  24/7 Competitive Intelligence
                </CardTitle>
                <CardDescription>
                  AI monitoring competitors and identifying opportunities in real-time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {monitoringData?.alerts && (
                  <div className="space-y-3 mb-6">
                    {monitoringData.alerts.map((alert: string, index: number) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        <span className="font-medium text-orange-800">{alert}</span>
                      </div>
                    ))}
                  </div>
                )}

                <Button 
                  onClick={startAutomaticMonitoring}
                  disabled={isMonitoring}
                  className="w-full mb-4"
                >
                  {isMonitoring ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running Analysis...
                    </>
                  ) : (
                    <>
                      <Target className="mr-2 h-4 w-4" />
                      Refresh Intelligence
                    </>
                  )}
                </Button>

                {monitoringData && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="border-red-200 bg-red-50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-red-800">Threats</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-red-600">
                            {monitoringData.monitoring?.competitiveThreats?.length || 0}
                          </div>
                          <div className="text-xs text-red-600">Active threats</div>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-green-200 bg-green-50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-green-800">Opportunities</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-green-600">
                            {monitoringData.monitoring?.immediateOpportunities?.length || 0}
                          </div>
                          <div className="text-xs text-green-600">Ready to exploit</div>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-blue-200 bg-blue-50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-blue-800">Viral Triggers</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-blue-600">
                            {monitoringData.monitoring?.viralTriggers?.length || 0}
                          </div>
                          <div className="text-xs text-blue-600">Ready to activate</div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Dashboard */}
          <TabsContent value="results" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Automation Performance
                </CardTitle>
                <CardDescription>
                  Real-time results from your automated campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Bot className="h-16 w-16 text-juice-orange mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Automation Engine Ready</h3>
                  <p className="text-muted-foreground mb-4">
                    Deploy a campaign to start seeing automated results and performance metrics
                  </p>
                  <Badge variant="outline" className="bg-juice-orange/10 text-juice-orange">
                    Ready to dominate the competition
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AutomatedCampaignDashboard;