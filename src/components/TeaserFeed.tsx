import { useState } from "react";
import { Lock } from "lucide-react";
import { JuiceIcon, MilkIcon } from "@/components/icons/BrandVoteIcons";
import { Button } from "@/components/ui/button";
import { landingPhotoUrl } from "@/lib/landingPhotos";

/**
 * Illustrative teaser feed for the UNVERIFIED home — gives signed-up-but-unverified users
 * something alive to look at (the screen was all CTAs + empty states before) and a concrete
 * reason to finish verification.
 *
 * IMPORTANT: every card here is a synthetic EXAMPLE, never a real story. Real stories are
 * RLS-gated for unverified readers, and a CSS-blurred real card could leak PII via devtools.
 * Faces are AI-generated / synthetic placeholders — no real, identifiable person is depicted
 * (which would be a false-light / right-of-publicity risk next to negative review labels).
 *
 * To swap the gradient placeholders for photoreal faces, drop 5 synthetic portraits into
 * public/lovable-uploads/ named example-1.jpg … example-5.jpg. Until then the cards render a
 * tasteful gradient + initial, so it never looks broken.
 */

interface TeaserCardData {
  img: string;
  subject: string;
  handle: string;
  time: string;
  vibe: string;
  green: number;
  red: number;
}

// Balanced mix of green- and red-flag vibes — a demo of the product, not a pile-on.
const EXAMPLES: TeaserCardData[] = [
  { img: landingPhotoUrl(1), subject: "Maya", handle: "late_checkout", time: "2h", vibe: "💚 thoughtful · great communicator", green: 38, red: 2 },
  { img: landingPhotoUrl(2), subject: "Jess", handle: "throwback_j", time: "5h", vibe: "🚩🚩 ghosted after 3 months", green: 9, red: 41 },
  { img: landingPhotoUrl(3), subject: "Bri", handle: "quietly_done", time: "8h", vibe: "💯 loyal · honest to a fault", green: 52, red: 4 },
  { img: landingPhotoUrl(4), subject: "Sam", handle: "weekend_plans", time: "11h", vibe: "☠️ hot & cold · plays games", green: 6, red: 28 },
  { img: landingPhotoUrl(5), subject: "Alex", handle: "no_pressure", time: "1d", vibe: "✨ fun first date, zero pressure", green: 21, red: 3 },
];

const BLURRED: TeaserCardData[] = [
  { img: landingPhotoUrl(2), subject: "—", handle: "verified_member", time: "1d", vibe: "🚩 lovebombed then vanished", green: 4, red: 33 },
  { img: landingPhotoUrl(3), subject: "—", handle: "verified_member", time: "2d", vibe: "💚 green flag all the way", green: 47, red: 1 },
];

const CardImage = ({ src, label }: { src: string; label: string }) => {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="aspect-square w-full bg-gradient-to-br from-primary/25 to-primary/5 flex items-center justify-center">
        <span className="text-4xl font-bold text-primary/50">{label.charAt(0)}</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className="aspect-square w-full object-cover"
    />
  );
};

const TeaserCard = ({ card }: { card: TeaserCardData }) => (
  <div className="bg-background border border-border rounded-xl overflow-hidden">
    <div className="flex items-center gap-2 px-3 py-2">
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold shrink-0">
        {card.subject.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-foreground truncate">{card.subject}</p>
        <p className="text-[10px] text-muted-foreground">@{card.handle} · {card.time} ago</p>
      </div>
    </div>
    <CardImage src={card.img} label={card.subject} />
    <div className="px-3 py-2">
      <div className="flex items-center gap-2 mb-1">
        <JuiceIcon className="h-4 w-4" />
        <MilkIcon className="h-4 w-4" />
        <span className="text-[11px] text-muted-foreground">
          {card.green >= card.red
            ? `${Math.round((card.green / (card.green + card.red)) * 100)}% say she got the juice`
            : `${Math.round((card.red / (card.green + card.red)) * 100)}% say spoiled milk`}
        </span>
      </div>
      <p className="text-xs text-foreground">{card.vibe}</p>
    </div>
  </div>
);

const TeaserFeed = ({ onStartVerification }: { onStartVerification: () => void }) => {
  return (
    <section aria-label="Example stories">
      <div className="flex items-center justify-between px-1 mb-2">
        <h3 className="text-sm font-semibold text-foreground">A taste of the feed</h3>
        <span className="text-[11px] text-muted-foreground">Examples · verify to see real stories</span>
      </div>

      <div className="space-y-3">
        {EXAMPLES.map((card, i) => (
          <TeaserCard key={i} card={card} />
        ))}
      </div>

      {/* Blurred lock — concrete reason to finish verification */}
      <div className="relative mt-3">
        <div className="space-y-3 blur-[6px] pointer-events-none select-none" aria-hidden>
          {BLURRED.map((card, i) => (
            <TeaserCard key={i} card={card} />
          ))}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-2 px-6 bg-background/40">
          <div className="h-11 w-11 rounded-full bg-background border border-border flex items-center justify-center">
            <Lock className="h-5 w-5 text-primary" strokeWidth={1.8} />
          </div>
          <p className="text-sm font-semibold text-foreground">Verify to unlock real stories</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            A 30-second selfie proves you're a real guy and opens the full feed of verified stories.
          </p>
          <Button onClick={onStartVerification} size="sm" className="mt-1">
            Verify with a selfie
          </Button>
        </div>
      </div>
    </section>
  );
};

export default TeaserFeed;
