import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import BrandLockup from "@/components/BrandLockup";
import { ShieldCheck, Sparkles, Clock, CheckCircle2, XCircle, User, LogOut, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";
import { useMySubmissions } from "@/hooks/useStories";
import ReferralPrompt from "@/components/ReferralPrompt";
import SubjectSearch from "@/components/SubjectSearch";
import TeaserFeed from "@/components/TeaserFeed";

interface UnverifiedHomeProps {
  /** Opens the composer; a search miss passes the name so it lands prefilled. */
  onCreateStory: (subjectName?: string) => void;
  onStartVerification: () => void;
  /**
   * True when the user created a profile earlier but never submitted the
   * selfie — i.e. they opted into verification and stalled one step from done.
   * Surfaces a prominent resume card instead of the generic verify pitch.
   */
  resumeVerification?: boolean;
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
const UnverifiedHome = ({ onCreateStory, onStartVerification, resumeVerification }: UnverifiedHomeProps) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: submissions = [] } = useMySubmissions(user?.id);
  // A review that's waiting on the selfie is the strongest reason to verify —
  // it's their own words, held one step from live.
  const heldReview = submissions.find((s) => s.status === "pending");

  // First-visit orientation: name the two paths explicitly, dismissible forever.
  const orientationKey = `juice_orientation_dismissed_${user?.id ?? "anon"}`;
  const [showOrientation, setShowOrientation] = useState(
    () => !localStorage.getItem(orientationKey)
  );
  const dismissOrientation = () => {
    localStorage.setItem(orientationKey, "1");
    setShowOrientation(false);
  };

  return (
    <div className="min-h-screen bg-background pb-[calc(5rem+env(safe-area-inset-bottom,0px))]">
      {/* Header */}
      <header className="sticky top-0 z-40 pt-[env(safe-area-inset-top,0px)] bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between px-4 h-12 max-w-xl mx-auto">
          <Link to="/app" aria-label="Juice home">
            <BrandLockup variant="inline" size="sm" />
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={onStartVerification}
              className="min-h-11 px-3 -mx-1 flex items-center text-xs font-semibold text-primary"
            >
              Verify
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Account menu"
                  className="h-11 w-11 -mr-1.5 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                >
                  <User className="h-5 w-5 text-foreground" strokeWidth={1.8} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="h-4 w-4 mr-2" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="h-4 w-4 mr-2" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-4 space-y-4">
        {/* Held-review card — they posted before verifying. Their review is saved and
            publishes once the selfie is approved; this is the one thing standing between
            them and being live. Outranks the generic resume pitch. */}
        {heldReview && (
          <Card className="p-4 border-primary/40 bg-primary/5">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-foreground">
                  {heldReview.subject_name
                    ? `Your review of ${heldReview.subject_name} is one selfie from live`
                    : "Your review is one selfie from live"}
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5 mb-3">
                  It's saved. A 30-second selfie proves you're a real guy — then it publishes
                  and every other story unlocks.
                </p>
                <Button onClick={onStartVerification} className="w-full">
                  Verify to publish it
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Resume card — user finished the profile but stalled at the selfie.
            Shown first: they already opted in, one step re-engages them. */}
        {resumeVerification && !heldReview && (
          <Card className="p-4 border-primary/40 bg-primary/5">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-foreground">
                  You're one step from verified
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5 mb-3">
                  Your profile's done — all that's left is a 30-second selfie.
                  Finish now to unlock every real story.
                </p>
                <Button onClick={onStartVerification} className="w-full">
                  Finish verification
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Search-led magic moment — look someone up before anything else */}
        <SubjectSearch onStartVerification={onStartVerification} onCreateStory={onCreateStory} />

        {/* Orientation — make the two unverified paths explicit, once */}
        {showOrientation && (
          <Card className="p-4 bg-card border-border relative">
            <button
              onClick={dismissOrientation}
              aria-label="Dismiss"
              className="absolute top-1 right-1 h-10 w-10 flex items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <p className="text-sm font-semibold text-foreground mb-2 pr-8">
              You're signed up. Two ways to start:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1.5">
              <li className="flex gap-2">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden />
                <span>
                  <span className="text-foreground font-medium">Verify with a 30-second selfie</span>{" "}
                  — unlocks every real story.
                </span>
              </li>
              <li className="flex gap-2">
                <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden />
                <span>
                  <span className="text-foreground font-medium">Or post right now</span> — it's
                  saved immediately and goes live once you're verified.
                </span>
              </li>
            </ul>
          </Card>
        )}

        {/* Illustrative teaser feed — gives the screen life and a reason to verify */}
        <TeaserFeed onStartVerification={onStartVerification} />

        {/* Hero CTA */}
        <Card className="p-5 bg-card border-border">
          <div className="flex items-start gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Share the Juice — post first, verify after</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Post right now. It's saved, and goes live once your selfie is approved.
              </p>
            </div>
          </div>
          <Button onClick={() => onCreateStory()} className="w-full">
            Share the Juice
          </Button>
        </Card>

        {/* Verify card (hidden when the resume/held-review card is already pitching it) */}
        {!resumeVerification && !heldReview && (
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
        )}

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
                    <div className="flex-1 min-w-0">
                      {s.subject_name && (
                        <p className="text-sm font-semibold text-foreground truncate">{s.subject_name}</p>
                      )}
                      <p className="text-sm text-foreground line-clamp-2">{s.content}</p>
                    </div>
                    {s.status === 'pending' && (
                      <Badge variant="secondary" className="shrink-0">
                        <Clock className="h-3 w-3 mr-1" /> Held until verified
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

      <Navigation onCreateStory={() => onCreateStory()} />
    </div>
  );
};

export default UnverifiedHome;