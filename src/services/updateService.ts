import { Capacitor } from "@capacitor/core";
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
  /** versionCode de APK que este bundle necesita para funcionar. */
  minNativeBuild?: number;
}

/** El shell instalado es más viejo de lo que el bundle publicado necesita. */
export interface NativeUpdateRequired {
  minNativeBuild: number | null;
  installedBuild: number | null;
  version: string;
  apkUrl: string | null;
}

interface CheckUpdateResponse {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  updateInfo: VersionInfo | null;
  requiresNativeUpdate?: boolean;
  nativeUpdate?: NativeUpdateRequired | null;
}

export interface UpdateCheckResult {
  /** Bundle OTA listo para instalar, o null. */
  update: VersionInfo | null;
  /** Presente cuando hay que instalar un APK en vez de un bundle. */
  nativeUpdate: NativeUpdateRequired | null;
}

const CURRENT_VERSION = packageJson.version;

/**
 * versionCode del APK instalado, o `null` si no se puede saber.
 *
 * Lo lee @capacitor/app, que también es el plugin del botón atrás. Que no esté
 * disponible no es un error a tragarse: significa que el APK es anterior a
 * v096, justo el que hay que reemplazar. `null` viaja al servidor y allí cuenta
 * como "demasiado viejo".
 */
export async function getNativeBuild(): Promise<number | null> {
  if (!Capacitor.isNativePlatform()) return null;
  if (!Capacitor.isPluginAvailable("App")) {
    console.warn(
      "[update] El plugin nativo App no está en este APK: se pedirá instalar desde la tienda."
    );
    return null;
  }
  try {
    const { App } = await import("@capacitor/app");
    const info = await App.getInfo();
    const build = parseInt(String(info.build), 10);
    return Number.isFinite(build) ? build : null;
  } catch (error) {
    console.warn("[update] No se pudo leer la versión nativa", error);
    return null;
  }
}

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
   * Qué actualización corresponde a este dispositivo.
   *
   * Manda el versionCode del APK junto con la versión del bundle: un bundle que
   * necesita código nativo nuevo no se puede entregar a un shell viejo, porque
   * se instala sin error y la función nueva queda muerta en silencio. Cuando
   * pasa eso el servidor devuelve `nativeUpdate` y ningún `updateInfo`.
   */
  async checkForUpdates(): Promise<UpdateCheckResult> {
    try {
      const nativeBuild = await getNativeBuild();
      const response = await apiFetch<CheckUpdateResponse>(
        "/api/v1/mobile/check-update",
        {
          method: "GET",
          query: {
            current_version: CURRENT_VERSION,
            ...(nativeBuild !== null ? { native_build: nativeBuild } : {}),
          },
          withAuth: false,
        }
      );

      if (response.requiresNativeUpdate) {
        return { update: null, nativeUpdate: response.nativeUpdate ?? null };
      }
      return {
        update: response.hasUpdate ? response.updateInfo : null,
        nativeUpdate: null,
      };
    } catch (error) {
      console.error("Failed to check for updates:", error);
      return { update: null, nativeUpdate: null };
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

      // Segunda barrera, por si este método se llama desde otro lado sin haber
      // pasado por checkForUpdates(). Instalar el bundle igual no rompe la app,
      // pero deja funciones muertas sin ninguna señal, que es lo que hay que
      // evitar.
      if (updateInfo.minNativeBuild != null) {
        const nativeBuild = await getNativeBuild();
        if (nativeBuild === null || nativeBuild < updateInfo.minNativeBuild) {
          console.error(
            `[update] APK ${nativeBuild ?? "desconocido"} es anterior al mínimo ` +
              `${updateInfo.minNativeBuild}; no se instala el bundle.`
          );
          return false;
        }
      }

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
