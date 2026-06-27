import { useNavigate } from "react-router-dom";
import { ShieldCheck, Sparkles, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";
import { useMySubmissions } from "@/hooks/useStories";
import ReferralPrompt from "@/components/ReferralPrompt";
import SubjectSearch from "@/components/SubjectSearch";

interface UnverifiedHomeProps {
  onCreateStory: () => void;
  onStartVerification: () => void;
}

/**
 * Home screen shown to logged-in users who haven't verified yet.
 * - Hero: share-your-story CTA (unverified users CAN post; goes to admin review)
 * - Verify card: unlock the real feed
 * - Blurred teaser feed: synthetic placeholder cards so the app doesn't look empty
 *   (we don't render real stories here — RLS blocks unverified readers, and a real
 *   blur could leak PII via devtools)
 * - Your submissions: only the current user's own posts, with status badges
 */
const UnverifiedHome = ({ onCreateStory, onStartVerification }: UnverifiedHomeProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: submissions = [] } = useMySubmissions(user?.id);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between px-4 h-12 max-w-xl mx-auto">
          <h1 className="ig-wordmark">
            The <span className="accent">Juice</span> App
          </h1>
          <button
            onClick={onStartVerification}
            className="text-xs font-semibold text-primary"
          >
            Verify
          </button>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-4 space-y-4">
        {/* Search-led magic moment — look someone up before anything else */}
        <SubjectSearch onStartVerification={onStartVerification} />

        {/* Orientation — make the unverified path explicit */}
        <p className="text-sm text-muted-foreground px-1 pt-1 leading-relaxed">
          You're signed up.{" "}
          <span className="text-foreground font-medium">Verify with a quick selfie</span> to fully
          join and read every story — or share a story right now, no verification needed.
        </p>

        {/* Hero CTA */}
        <Card className="p-5 bg-card border-border">
          <div className="flex items-start gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Share a story — no verification needed</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                You can post right now. An admin reviews every story before it's published on the site.
              </p>
            </div>
          </div>
          <Button onClick={onCreateStory} className="w-full">
            Share your story
          </Button>
        </Card>

        {/* Verify card */}
        <Card className="p-5 bg-card border-border">
          <div className="flex items-start gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Become a verified member</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                A 30-second selfie proves you're a real guy — and unlocks every real story. It's how you fully join.
              </p>
            </div>
          </div>
          <Button onClick={onStartVerification} variant="outline" className="w-full">
            Verify with a selfie
          </Button>
        </Card>

        {/* "How did you hear about us?" — below CTAs so it doesn't block onboarding */}
        {user && <ReferralPrompt userId={user.id} />}

        {/* Your submissions */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2 px-1">Your submissions</h3>
          {submissions.length === 0 ? (
            <p className="text-sm text-muted-foreground px-1">
              You haven't posted anything yet.
            </p>
          ) : (
            <div className="space-y-2">
              {submissions.map((s) => (
                <Card key={s.id} className="p-3 bg-card border-border">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-foreground line-clamp-2 flex-1">{s.content}</p>
                    {s.status === 'pending' && (
                      <Badge variant="secondary" className="shrink-0">
                        <Clock className="h-3 w-3 mr-1" /> Pending
                      </Badge>
                    )}
                    {s.status === 'approved' && (
                      <Badge className="shrink-0 bg-primary text-primary-foreground">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Approved
                      </Badge>
                    )}
                    {s.status === 'rejected' && (
                      <Badge variant="destructive" className="shrink-0">
                        <XCircle className="h-3 w-3 mr-1" /> Rejected
                      </Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

      </div>

      <Navigation onCreateStory={onCreateStory} />
    </div>
  );
};

export default UnverifiedHome;