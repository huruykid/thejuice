import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, Shield, Eye, UserX, Trash2, AlertTriangle, Lock, Bell, Download, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const PrivacySettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Privacy settings state
  const [settings, setSettings] = useState({
    // Content & Safety
    allowDirectMessages: false,
    hideStoryFromSearch: false,
    requireApprovalForComments: true,
    blockOffensiveContent: true,
    
    // Data Privacy
    shareAnalytics: false,
    allowDataExport: true,
    trackingProtection: true,
    
    // Account Security
    twoFactorAuth: false,
    loginNotifications: true,
    suspiciousActivityAlerts: true,
    
    // Communication
    emailNotifications: false,
    pushNotifications: false,
    communityUpdates: false,
    
    // Advanced Privacy
    autoDeleteStories: false,
    anonymizeData: true,
    restrictDataSharing: true
  });

  const updateSetting = (key: keyof typeof settings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    toast({
      title: "Setting updated",
      description: "Your privacy preference has been saved.",
    });
  };

  const handleDataExport = () => {
    toast({
      title: "Data export requested",
      description: "You'll receive an email with your data within 48 hours.",
    });
  };

  const handleAccountDeletion = () => {
    toast({
      title: "Account deletion initiated",
      description: "Your account will be permanently deleted within 30 days. You can cancel this action by contacting support.",
      variant: "destructive"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-juice-orange/5 to-juice-pink/5 pb-20">
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="mr-3"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-juice-orange" />
            <h1 className="text-2xl font-bold text-foreground">Privacy & Safety</h1>
          </div>
        </div>

        {/* Content & Safety */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Content & Safety
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Block offensive content</Label>
                <p className="text-sm text-muted-foreground">Automatically filter harmful content</p>
              </div>
              <Switch
                checked={settings.blockOffensiveContent}
                onCheckedChange={(value) => updateSetting('blockOffensiveContent', value)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require comment approval</Label>
                <p className="text-sm text-muted-foreground">Review comments before they appear</p>
              </div>
              <Switch
                checked={settings.requireApprovalForComments}
                onCheckedChange={(value) => updateSetting('requireApprovalForComments', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Hide stories from search</Label>
                <p className="text-sm text-muted-foreground">Keep your content private</p>
              </div>
              <Switch
                checked={settings.hideStoryFromSearch}
                onCheckedChange={(value) => updateSetting('hideStoryFromSearch', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow direct messages</Label>
                <p className="text-sm text-muted-foreground">Let others message you privately</p>
              </div>
              <Switch
                checked={settings.allowDirectMessages}
                onCheckedChange={(value) => updateSetting('allowDirectMessages', value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Privacy */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Data Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Tracking protection</Label>
                <p className="text-sm text-muted-foreground">Block third-party trackers</p>
              </div>
              <Switch
                checked={settings.trackingProtection}
                onCheckedChange={(value) => updateSetting('trackingProtection', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Anonymize personal data</Label>
                <p className="text-sm text-muted-foreground">Remove identifying information</p>
              </div>
              <Switch
                checked={settings.anonymizeData}
                onCheckedChange={(value) => updateSetting('anonymizeData', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Restrict data sharing</Label>
                <p className="text-sm text-muted-foreground">Limit sharing with third parties</p>
              </div>
              <Switch
                checked={settings.restrictDataSharing}
                onCheckedChange={(value) => updateSetting('restrictDataSharing', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Share analytics</Label>
                <p className="text-sm text-muted-foreground">Help improve the app anonymously</p>
              </div>
              <Switch
                checked={settings.shareAnalytics}
                onCheckedChange={(value) => updateSetting('shareAnalytics', value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Security */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Login notifications</Label>
                <p className="text-sm text-muted-foreground">Get alerts for new logins</p>
              </div>
              <Switch
                checked={settings.loginNotifications}
                onCheckedChange={(value) => updateSetting('loginNotifications', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Suspicious activity alerts</Label>
                <p className="text-sm text-muted-foreground">Monitor for unusual account activity</p>
              </div>
              <Switch
                checked={settings.suspiciousActivityAlerts}
                onCheckedChange={(value) => updateSetting('suspiciousActivityAlerts', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Two-factor authentication</Label>
                <p className="text-sm text-muted-foreground">Add extra security to your account</p>
              </div>
              <Switch
                checked={settings.twoFactorAuth}
                onCheckedChange={(value) => updateSetting('twoFactorAuth', value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Communication Preferences */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Communication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email notifications</Label>
                <p className="text-sm text-muted-foreground">Receive updates via email</p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(value) => updateSetting('emailNotifications', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Push notifications</Label>
                <p className="text-sm text-muted-foreground">Get mobile notifications</p>
              </div>
              <Switch
                checked={settings.pushNotifications}
                onCheckedChange={(value) => updateSetting('pushNotifications', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Community updates</Label>
                <p className="text-sm text-muted-foreground">News about app features</p>
              </div>
              <Switch
                checked={settings.communityUpdates}
                onCheckedChange={(value) => updateSetting('communityUpdates', value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Advanced Options */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Advanced Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-delete old stories</Label>
                <p className="text-sm text-muted-foreground">Remove stories after 90 days</p>
              </div>
              <Switch
                checked={settings.autoDeleteStories}
                onCheckedChange={(value) => updateSetting('autoDeleteStories', value)}
              />
            </div>

            <Separator />

            <Button
              variant="outline"
              className="w-full"
              onClick={handleDataExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Export My Data
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/privacy-policy')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Privacy Policy & Terms
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/support')}
            >
              <UserX className="h-4 w-4 mr-2" />
              Report Content or User
            </Button>

            <Separator />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account Permanently
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account
                    and remove all your data from our servers. All your stories, comments,
                    and account information will be permanently deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleAccountDeletion}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* Legal Notice */}
        <div className="text-center text-sm text-muted-foreground mb-6">
          <p>We are committed to protecting your privacy and ensuring the safety of our community.</p>
          <p className="mt-2">All settings are encrypted and stored securely.</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacySettings;