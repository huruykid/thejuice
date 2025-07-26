import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Plus, 
  Copy, 
  CheckCircle, 
  Clock, 
  Share2,
  UserPlus 
} from "lucide-react";
import { useInvites } from "@/hooks/useInvites";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

const InviteManager = () => {
  const [showCodes, setShowCodes] = useState(false);
  const { 
    inviteStats, 
    inviteCodes, 
    statsLoading, 
    codesLoading, 
    generateInvite, 
    generatingInvite 
  } = useInvites();
  const { toast } = useToast();

  const copyToClipboard = async (code: string) => {
    const shareText = `Finally, men have a voice. Join the Tea App for Men - where the stories are real and the juice is anonymous.
👉 https://sipjuice.app?invite=${code}

#fortheboys #teaappformen #getthejuice`;

    try {
      await navigator.clipboard.writeText(shareText);
      toast({
        title: "Copied!",
        description: "Invite message copied to clipboard",
      });
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      toast({
        title: "Copied!",
        description: "Invite message copied to clipboard",
      });
    }
  };

  const shareInvite = async (code: string) => {
    const shareText = `Finally, men have a voice. Join the Tea App for Men - where the stories are real and the juice is anonymous.
👉 https://sipjuice.app?invite=${code}

#fortheboys #teaappformen #getthejuice`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Juice',
          text: shareText,
        });
      } catch (err) {
        // User cancelled sharing
      }
    } else {
      // Fallback to copying
      copyToClipboard(code);
    }
  };

  if (statsLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading invites...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Invite Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Your Invites
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-juice-orange">
                {inviteStats?.invites_remaining || 0}
              </div>
              <div className="text-sm text-muted-foreground">Remaining</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-juice-pink">
                {inviteStats?.invites_sent || 0}
              </div>
              <div className="text-sm text-muted-foreground">Sent</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-juice-green">
                {inviteStats?.invites_used || 0}
              </div>
              <div className="text-sm text-muted-foreground">Used</div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => generateInvite()}
              disabled={generatingInvite || (inviteStats?.invites_remaining || 0) <= 0}
              className="flex-1"
              variant="juice"
            >
              <Plus className="h-4 w-4 mr-2" />
              {generatingInvite ? "Generating..." : "Generate Invite"}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowCodes(!showCodes)}
              className="px-4"
            >
              {showCodes ? "Hide" : "View"} Codes
            </Button>
          </div>

          {(inviteStats?.invites_remaining || 0) <= 0 && (
            <div className="text-center p-4 bg-juice-orange/10 rounded-lg">
              <UserPlus className="h-8 w-8 text-juice-orange mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No invites remaining. You'll get more when your friends join!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Codes */}
      {showCodes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Invite Codes</CardTitle>
          </CardHeader>
          <CardContent>
            {codesLoading ? (
              <div className="text-center text-muted-foreground">Loading codes...</div>
            ) : inviteCodes && inviteCodes.length > 0 ? (
              <div className="space-y-3">
                {inviteCodes.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-lg font-bold text-juice-orange">
                          {invite.code}
                        </code>
                        {invite.used_by ? (
                          <Badge variant="secondary" className="bg-juice-green/20 text-juice-green">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Used
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {invite.used_by 
                          ? `Used ${formatDistanceToNow(new Date(invite.used_at!))} ago`
                          : `Expires ${formatDistanceToNow(new Date(invite.expires_at))} from now`
                        }
                      </div>
                    </div>
                    
                    {!invite.used_by && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(invite.code)}
                          className="h-8 w-8 p-0"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => shareInvite(invite.code)}
                          className="h-8 w-8 p-0"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No invite codes generated yet.</p>
                <p className="text-sm">Generate your first invite code above!</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InviteManager;