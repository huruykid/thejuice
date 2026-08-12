import { Capacitor } from "@capacitor/core";

/**
 * Service-worker registration and the small set of PWA facts the UI needs.
 *
 * The registration is deliberately conditional. Inside the Capacitor shell the app
 * is served from capacitor://localhost — a `localhost` hostname that would sneak
 * past a naive secure-context check and hand the native app a second, competing
 * cache layer on top of WKWebView's. The native builds must never register it.
 */

/** True when the page is running as an installed app rather than a browser tab. */
export const isStandalone = (): boolean =>
  window.matchMedia("(display-mode: standalone)").matches ||
  window.matchMedia("(display-mode: minimal-ui)").matches ||
  // iOS Safari predates display-mode and still reports this instead.
  (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

/** iOS Safari has no beforeinstallprompt — installing there is a manual Share-sheet step. */
export const isIos = (): boolean =>
  /iphone|ipad|ipod/i.test(window.navigator.userAgent) ||
  // iPadOS 13+ reports as a Mac; the touch points give it away.
  (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);

export const registerServiceWorker = (): void => {
  if (Capacitor.isNativePlatform()) return;
  if (!("serviceWorker" in navigator)) return;
  // Secure context only — and never against the Vite dev server, where a cached
  // shell fights hot module reload.
  if (!window.isSecureContext) return;
  if (import.meta.env.DEV) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then(
      (registration) => {
        // A worker that installed while an old one is controlling the page sits in
        // `waiting` until every tab closes. Users keep the PWA open for weeks, so
        // ask it to take over now; the next navigation renders the new build.
        const promote = () => {
          if (registration.waiting) registration.waiting.postMessage("SKIP_WAITING");
        };
        promote();
        registration.addEventListener("updatefound", () => {
          registration.installing?.addEventListener("statechange", promote);
        });
      },
      (error) => {
        // A failed registration must never take the app down with it — the site
        // works fine without a worker.
        console.error("Service worker registration failed:", error);
      }
    );

    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      // Guard against the reload loop: controllerchange fires again on the way back up.
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  });
};
