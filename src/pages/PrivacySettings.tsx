import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Shield, Eye, UserX, Trash2, Bell, FileText, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserPreferences, useUpdateUserPreferences, type UserPreferences } from "@/hooks/useUserPreferences";

const PrivacySettings = () => {
  const navigate = useNavigate();
  const { data: prefs, isLoading } = useUserPreferences();
  const updatePrefs = useUpdateUserPreferences();
  const [deleting, setDeleting] = useState(false);

  const handleToggle = (key: keyof UserPreferences, value: boolean) => {
    updatePrefs.mutate({ [key]: value } as Partial<UserPreferences>, {
      onError: () => toast.error("Couldn't save that preference. Try again."),
    });
  };

  const handleAccountDeletion = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke("delete-account");
      if (error) throw error;
      toast.success("Your account has been deleted.");
      await supabase.auth.signOut();
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Account deletion failed:", err);
      toast.error("We couldn't delete your account. Please contact support.");
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-juice-orange/5 to-juice-pink/5 pb-20">
      <div className="container mx-auto px-4 py-6 max-w-md">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-3">
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
            <ToggleRow
              label="Block offensive content"
              description="Filter slurs and graphic content from the feed"
              checked={prefs?.blockOffensiveContent ?? true}
              disabled={isLoading}
              onChange={(v) => handleToggle("blockOffensiveContent", v)}
            />
            <ToggleRow
              label="Hide my stories from search"
              description="Your stories still appear in the feed; just not in search results"
              checked={prefs?.hideStoryFromSearch ?? false}
              disabled={isLoading}
              onChange={(v) => handleToggle("hideStoryFromSearch", v)}
            />
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ToggleRow
              label="Email notifications"
              description="Approval emails and replies to your stories"
              checked={prefs?.emailNotifications ?? true}
              disabled={isLoading}
              onChange={(v) => handleToggle("emailNotifications", v)}
            />
            <ToggleRow
              label="Push notifications"
              description="In-app pushes when your story gets a flag or comment"
              checked={prefs?.pushNotifications ?? true}
              disabled={isLoading}
              onChange={(v) => handleToggle("pushNotifications", v)}
            />
            <ToggleRow
              label="Community updates"
              description="Occasional news about new features"
              checked={prefs?.communityUpdates ?? false}
              disabled={isLoading}
              onChange={(v) => handleToggle("communityUpdates", v)}
            />
          </CardContent>
        </Card>

        {/* Account */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full" onClick={() => navigate("/privacy-policy")}>
              <FileText className="h-4 w-4 mr-2" />
              Privacy Policy & Terms
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate("/support")}>
              <UserX className="h-4 w-4 mr-2" />
              Report Content or User
            </Button>

            <Separator />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full" disabled={deleting}>
                  {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                  Delete Account Permanently
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This is permanent. Your profile, stories, comments, reactions, and verification
                    will all be removed immediately. This cannot be undone.
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

        <div className="text-center text-sm text-muted-foreground mb-6">
          <p>Need to change your username, password, or 2FA? Contact support.</p>
        </div>
      </div>
    </div>
  );
};

function ToggleRow({
  label, description, checked, onChange, disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5 pr-3">
        <Label>{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}

export default PrivacySettings;