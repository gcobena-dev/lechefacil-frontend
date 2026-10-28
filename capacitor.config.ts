/// <reference types="@capacitor/status-bar" />
/// <reference types="@capawesome/capacitor-android-edge-to-edge-support" />
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lechefacil.app',
  appName: 'LecheFacil',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    },
    Camera: {
      presentationStyle: 'fullscreen'
    },
    // Los insets los aplica @capawesome/capacitor-android-edge-to-edge-support;
    // si SystemBars (core desde Capacitor 8) también los aplica, se duplican.
    SystemBars: {
      insetsHandling: 'disable'
    }
  }
};

export default config;
