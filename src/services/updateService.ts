import { apiFetch } from "./client";
import packageJson from "../../package.json";

interface VersionInfo {
  version: string;
  versionCode: number;
  apkUrl: string;
  latestApkUrl: string;
  updateBundleUrl: string;
  releaseDate: string;
  minVersion: string;
  changelog: string;
}

interface CheckUpdateResponse {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  updateInfo: VersionInfo | null;
}

const CURRENT_VERSION = packageJson.version;

export class UpdateService {
  /**
   * Get latest version information from backend
   */
  async getLatestVersion(): Promise<VersionInfo> {
    return apiFetch<VersionInfo>("/api/v1/mobile/version", {
      method: "GET",
      withAuth: false,
    });
  }

  /**
   * Check if there's an update available
   */
  async checkForUpdates(): Promise<VersionInfo | null> {
    try {
      const response = await apiFetch<CheckUpdateResponse>(
        "/api/v1/mobile/check-update",
        {
          method: "GET",
          query: { current_version: CURRENT_VERSION },
          withAuth: false,
        }
      );

      return response.hasUpdate ? response.updateInfo : null;
    } catch (error) {
      console.error("Failed to check for updates:", error);
      return null;
    }
  }

  /**
   * Download and install update using Capacitor Updater
   * Note: Requires @capgo/capacitor-updater plugin
   */
  async downloadAndInstall(updateInfo: VersionInfo): Promise<boolean> {
    try {
      console.log("📦 Starting update process...");
      console.log("Version:", updateInfo.version);
      console.log("URL:", updateInfo.updateBundleUrl);

      // Dynamic import to avoid errors if plugin not installed
      const { CapacitorUpdater } = await import("@capgo/capacitor-updater");

      // Download update bundle
      console.log("⬇️  Downloading update bundle...");
      const downloadResult = await CapacitorUpdater.download({
        url: updateInfo.updateBundleUrl,
        version: updateInfo.version,
      });

      console.log("✅ Download result:", downloadResult);

      // downloadResult is BundleInfo which has 'id' directly
      const bundleId = downloadResult.id;

      if (!bundleId) {
        throw new Error("Download succeeded but no bundle ID returned");
      }

      console.log("📦 Bundle ID:", bundleId);

      // Set the new bundle as current (will apply on next reload)
      console.log("🔄 Setting new bundle...");
      await CapacitorUpdater.set({ id: bundleId });

      console.log("🚀 Reloading app...");

      // Reload app to apply update
      await CapacitorUpdater.reload();

      return true;
    } catch (error) {
      console.error("❌ Update failed:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      return false;
    }
  }

  /**
   * Get current app version
   */
  getCurrentVersion(): string {
    return CURRENT_VERSION;
  }
}

// Export singleton instance
export const updateService = new UpdateService();
