import { ReactNode } from "react";
import BrandLockup from "@/components/BrandLockup";

/**
 * THE shell for onboarding steps (welcome → profile → selfie) and their wait
 * states — flat IG-bones so onboarding looks like the app it lands in, instead
 * of a separate gradient-card product.
 *
 * - wordmark up top, safe-area padded
 * - step dots so users always know where they are in the 3-step flow
 * - `cta` renders pinned in the thumb zone above the home indicator
 */
interface OnboardingScaffoldProps {
  children: ReactNode;
  /** 1 = guidelines, 2 = profile, 3 = selfie. Omit for wait/success states. */
  step?: 1 | 2 | 3;
  /** Primary action, pinned bottom. Keep it ONE button (plus at most a text link). */
  cta?: ReactNode;
}

const TOTAL_STEPS = 3;

const OnboardingScaffold = ({ children, step, cta }: OnboardingScaffoldProps) => (
  <div className="flex min-h-screen flex-col bg-background pt-[calc(1rem+env(safe-area-inset-top,0px))]">
    {/* Brand + progress */}
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 px-4 pb-2 pt-2">
      <BrandLockup variant="inline" size="sm" />
      {step && (
        <div className="flex items-center gap-1.5" aria-label={`Step ${step} of ${TOTAL_STEPS}`}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={
                i + 1 === step
                  ? "h-1.5 w-6 rounded-full bg-primary"
                  : i + 1 < step
                    ? "h-1.5 w-1.5 rounded-full bg-primary/50"
                    : "h-1.5 w-1.5 rounded-full bg-muted"
              }
            />
          ))}
        </div>
      )}
    </div>

    {/* Content */}
    <div className="mx-auto w-full max-w-md flex-1 px-4 py-4">{children}</div>

    {/* Pinned CTA — thumb zone, clear of the home indicator */}
    {cta ? (
      <div className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto w-full max-w-md px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
          {cta}
        </div>
      </div>
    ) : (
      <div className="pb-[env(safe-area-inset-bottom,0px)]" />
    )}
  </div>
);

export default OnboardingScaffold;
