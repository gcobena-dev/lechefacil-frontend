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
      // Dynamic import to avoid errors if plugin not installed
      const { CapacitorUpdater } = await import("@capgo/capacitor-updater");

      console.log(
        `Downloading update ${updateInfo.version} from ${updateInfo.updateBundleUrl}`
      );

      // Download update bundle
      const { id } = await CapacitorUpdater.download({
        url: updateInfo.updateBundleUrl,
        version: updateInfo.version,
      });

      console.log(`Update downloaded with ID: ${id}`);

      // Set as current version
      await CapacitorUpdater.set({ id });

      console.log("Update applied, reloading...");

      // Reload app to apply update
      await CapacitorUpdater.reload();

      return true;
    } catch (error) {
      console.error("Failed to install update:", error);
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
