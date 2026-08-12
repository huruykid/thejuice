import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isIos, isStandalone } from "@/lib/pwa";

/**
 * "Add Juice to your home screen" — the one-tap composer.
 *
 * Two entirely different mechanics behind one banner:
 *   - Chromium fires `beforeinstallprompt`, which we stash and replay on tap. The
 *     event only fires once per page load and only when the browser already judges
 *     the app installable, so there is no way to force it — if it never arrives on
 *     a non-iOS browser, there is nothing to show and the banner stays hidden.
 *   - iOS has no such event: installing is a manual Share → Add to Home Screen, so
 *     there the banner is instructions, not a button.
 *
 * Dismissal sticks for a month. A nag bar above the feed is worse than no install.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "juice_install_prompt_dismissed_at";
const DISMISS_DAYS = 30;

const recentlyDismissed = (): boolean => {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    if (!at) return false;
    return Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    // Private mode / storage disabled: better to show it than to crash the feed.
    return false;
  }
};

const InstallPrompt = () => {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;
    if (isStandalone() || recentlyDismissed()) return;

    if (isIos()) {
      // Only Safari can add to the home screen; Chrome/Firefox on iOS and in-app
      // webviews (Instagram, TikTok) cannot, and telling them to would be a lie.
      const ua = window.navigator.userAgent;
      const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios|fban|fbav|instagram|line|micromessenger/i.test(ua);
      if (isSafari) setShowIosHint(true);
      return;
    }

    const onBeforeInstall = (event: Event) => {
      // Suppress Chrome's own mini-infobar so this banner is the only ask.
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    const onInstalled = () => setDeferred(null);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Nothing to do — it just means the banner comes back next session.
    }
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    // The event is single-use whatever the user picked.
    setDeferred(null);
  };

  if (dismissed || (!deferred && !showIosHint)) return null;

  return (
    <div className="border-b border-border bg-background px-4 py-3 lg:hidden">
      <div className="max-w-md mx-auto flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-foreground">
            Add Juice to your home screen
          </p>
          {showIosHint ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Tap{" "}
              <Share className="inline h-3.5 w-3.5 -mt-0.5" aria-label="the Share button" />{" "}
              then <span className="font-semibold text-foreground">Add to Home Screen</span> — posting
              is one tap from there.
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              Opens full screen, and posting is one tap from your home screen.
            </p>
          )}
          {!showIosHint && (
            <Button size="sm" className="mt-2" onClick={install}>
              Install
            </Button>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 -mr-2 text-muted-foreground"
          onClick={dismiss}
          aria-label="Dismiss install prompt"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default InstallPrompt;
