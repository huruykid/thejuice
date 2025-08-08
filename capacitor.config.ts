import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.da2e9ee24548482f80e76cfedc4bfcb9',
  appName: 'thejuice',
  webDir: 'dist',
  // server.url removed for production. Re-add for on-device live-reload during development.

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ff6b35',
      showSpinner: false
    }
  }
};

export default config;