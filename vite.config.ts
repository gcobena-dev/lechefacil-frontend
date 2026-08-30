import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    /**
     * Precaches the app shell so the web build opens with no connection, the way
     * the Android build already does (Capacitor ships `dist/` inside the APK).
     *
     * Deliberately shell-only: API responses are NOT cached here. On native,
     * CapacitorHttp routes fetch through the native layer, where a service
     * worker cannot see it — so data caching lives in the persisted react-query
     * store instead, which works identically on both platforms.
     */
    VitePWA({
      registerType: "autoUpdate",
      // Registration is done by hand in main.tsx so it can be skipped on
      // native, where @capgo/capacitor-updater owns the bundle and a service
      // worker caching assets would fight it.
      injectRegister: null,
      includeAssets: ["favicon.ico", "logo.png", "logo.webp"],
      manifest: {
        name: "LecheFácil",
        short_name: "LecheFácil",
        description: "Sistema de gestión para fincas lecheras",
        lang: "es",
        start_url: "/",
        display: "standalone",
        background_color: "#f8f8f4",
        theme_color: "#f8f8f4",
        icons: [192, 256, 512].map((size) => ({
          src: `/icons/icon-${size}.webp`,
          sizes: `${size}x${size}`,
          type: "image/webp",
          purpose: "any maskable",
        })),
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,webp,svg,woff2}"],
        // env.js is generated at container start: a cached copy would pin the
        // app to a stale API URL.
        navigateFallbackDenylist: [/^\/env\.js$/],
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        // Keep the dev server free of a service worker; it only muddies HMR.
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Ensure proper asset handling for Capacitor
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
}));
