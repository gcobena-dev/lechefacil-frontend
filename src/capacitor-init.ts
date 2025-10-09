import { EdgeToEdge } from '@capawesome/capacitor-android-edge-to-edge-support';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { initPushNotifications } from '@/services/push';
// Use registerPlugin to avoid bundling @capacitor/app (not installed in web)
const App = registerPlugin<any>('App');

const hslToHex = (h: number, s: number, l: number): string => {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

const getBackgroundColor = (isDarkMode: boolean): string => {
  if (isDarkMode) {
    // Dark theme: --background: 222.2 84% 4.9%
    return hslToHex(222.2, 84, 4.9);
  } else {
    // Light theme: --background: 135 20% 98%
    return hslToHex(135, 20, 98);
  }
};

const applyTheme = async (isDarkMode: boolean) => {
  const backgroundColor = getBackgroundColor(isDarkMode);

  if (isDarkMode) {
    // Dark theme: dark background + light icons
    await EdgeToEdge.setBackgroundColor({ color: backgroundColor });
    await StatusBar.setStyle({ style: Style.Dark });
  } else {
    // Light theme: light background + dark icons
    await EdgeToEdge.setBackgroundColor({ color: backgroundColor });
    await StatusBar.setStyle({ style: Style.Light });
  }
};

export async function initializeCapacitor() {
  // Only run on native platforms (Android/iOS)
  if (Capacitor.isNativePlatform()) {
    // ✅ CRITICAL: Notify Capacitor Updater FIRST, before anything else
    // This MUST be called within 10 seconds of app load to prevent rollback after OTA updates
    try {
      const { CapacitorUpdater } = await import("@capgo/capacitor-updater");
      await CapacitorUpdater.notifyAppReady();
    } catch (error) {
      console.error("❌ CRITICAL: Failed to notify app ready:", error);
    }

    // Continue with other initialization (non-blocking)
    try {
      // Enable Edge-to-Edge
      await EdgeToEdge.enable();

      // Detect if system uses dark theme
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

      // Apply initial theme
      await applyTheme(isDarkMode);

      // Initialize push notifications (requires authenticated session to register with backend)
      // Safe to call; it will no-op if not native or permissions denied
      await initPushNotifications();
      // Re-register on auth token changes (e.g., user logs in), best-effort
      window.addEventListener('lf_token_changed', () => {
        initPushNotifications();
      });

      // Listen for system theme changes
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', async (e) => {
        await applyTheme(e.matches);
      });

      // Handle Android hardware back button to navigate within the app
      App.addListener('backButton', ({ canGoBack }) => {
        try {
          if (canGoBack) {
            window.history.back();
          }
          // If cannot go back, allow default behavior (usually exits app)
        } catch (err) {
          console.error('Error handling backButton:', err);
        }
      });
    } catch (error) {
      console.error('Error initializing Capacitor:', error);
    }
  }
}
