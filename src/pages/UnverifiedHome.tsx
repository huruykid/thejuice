import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import BrandLockup from "@/components/BrandLockup";
import { ShieldCheck, Sparkles, User, LogOut, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";
import MySubmissions from "@/components/MySubmissions";
import ReferralPrompt from "@/components/ReferralPrompt";
import SubjectSearch from "@/components/SubjectSearch";
import TeaserFeed from "@/components/TeaserFeed";

interface UnverifiedHomeProps {
  onCreateStory: () => void;
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
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
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
        {/* Resume card — user finished the profile but stalled at the selfie.
            Shown first: they already opted in, one step re-engages them. */}
        {resumeVerification && (
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
        <SubjectSearch onStartVerification={onStartVerification} />

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
                  <span className="text-foreground font-medium">Or post right now</span> — no
                  verification needed; an admin reviews it before it's published.
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
              <h2 className="text-base font-semibold text-foreground">Share the Juice — no verification needed</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                You can post right now. An admin reviews every story before it's published on the site.
              </p>
            </div>
          </div>
          <Button onClick={onCreateStory} className="w-full">
            Share the Juice
          </Button>
        </Card>

        {/* Verify card (hidden when the resume card is already pitching it) */}
        {!resumeVerification && (
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
        <MySubmissions userId={user?.id} variant="full" />

      </div>

      <Navigation onCreateStory={onCreateStory} />
    </div>
  );
};

export default UnverifiedHome;