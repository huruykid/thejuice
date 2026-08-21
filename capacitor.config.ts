import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Reverse-domain bundle identifier for sipjuice.app. This is PERMANENT once
  // the app is first submitted to either store — change it before running
  // `npx cap add ios/android` if you want a different one (e.g. com.sipjuice.app).
  appId: 'app.sipjuice',
  appName: 'Juice',
  webDir: 'dist',
  // server.url removed for production. Re-add for on-device live-reload during development.

  ios: {
    // Camera capture is our only image source (no photo-library picker), so the
    // app doesn't need NSPhotoLibraryUsageDescription — keeps the review surface small.
    // 'never' + viewport-fit=cover in index.html: the web layer owns safe areas
    // via env(safe-area-inset-*), so fixed chrome (tab bar, sheets, lightbox)
    // pads itself. 'always' inset scroll content but left fixed elements flush
    // against the Dynamic Island / home indicator.
    contentInset: 'never',
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      // Brand amber (matches --primary / theme-color). Was the retired orange #ff6b35,
      // which flashed the wrong brand on every cold start.
      backgroundColor: '#f8b038',
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
