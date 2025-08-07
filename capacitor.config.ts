import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.da2e9ee24548482f80e76cfedc4bfcb9',
  appName: 'thejuice',
  webDir: 'dist',
  server: {
    url: 'https://da2e9ee2-4548-482f-80e7-6cfedc4bfcb9.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ff6b35',
      showSpinner: false
    }
  }
};

export default config;