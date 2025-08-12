import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PrivacyScreen } from '@capacitor/privacy-screen';

/**
 * iOS-native capture protection
 * - Enables Capacitor PrivacyScreen to hide content in app switcher/background
 * - Listens for OS screenshot events (via capacitor-screenshot-event) to briefly obscure the UI
 * - Gracefully no-ops on web/Android
 */
export const useIosCaptureProtection = () => {
  useEffect(() => {
    if (Capacitor.getPlatform() !== 'ios') return;

    // Hide sensitive content in app switcher and when app is backgrounded
    PrivacyScreen.enable().catch(() => {});

    let removeScreenshotListener: (() => void) | undefined;
    const addShield = () => {
      document.body.classList.add('screenshot-blur');
      // Remove after a short delay
      window.setTimeout(() => {
        document.body.classList.remove('screenshot-blur');
      }, 2000);
    };

    // Try to attach native screenshot listener if plugin is installed
    try {
      const anyWin = window as any;
      const plugin = anyWin?.Capacitor?.Plugins?.ScreenshotEvent || anyWin?.ScreenshotEvent;
      if (plugin?.addListener) {
        const sub = plugin.addListener('userScreenshot', () => {
          addShield();
        });
        // Some plugin versions return a Promise
        if (typeof sub?.then === 'function') {
          sub.then((ret: any) => {
            removeScreenshotListener = ret?.remove?.bind(ret);
          }).catch(() => {});
        } else if (sub && typeof sub.remove === 'function') {
          removeScreenshotListener = sub.remove.bind(sub);
        }
      }
    } catch {
      // Ignore if plugin is not available
    }

    return () => {
      PrivacyScreen.disable().catch(() => {});
      try {
        removeScreenshotListener?.();
      } catch {}
      document.body.classList.remove('screenshot-blur');
    };
  }, []);
};
