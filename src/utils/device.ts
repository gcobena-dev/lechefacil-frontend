import { Capacitor } from "@capacitor/core";

export function isMobileClient(): boolean {
  try {
    if (Capacitor.isNativePlatform && Capacitor.isNativePlatform()) return true;
  } catch (_) {
    // ignore
  }
  try {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  } catch (_) {
    return false;
  }
}
