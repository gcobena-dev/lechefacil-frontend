import { QueryClient, type Query } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import {
  persistQueryClientRestore,
  type PersistQueryClientOptions,
  type Persister,
} from "@tanstack/react-query-persist-client";
import { get, set, del } from "idb-keyval";
import { getTenantId, getToken } from "@/services/config";
import { isNetworkError } from "@/services/client";

/**
 * Bump when the cached shape changes in a way old entries cannot satisfy.
 * Everything persisted under a previous buster is dropped on restore.
 */
const CACHE_VERSION = "v1";
const CACHE_KEY = "lf-query-cache";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 días, en disco

/**
 * How long an unobserved query stays in memory.
 *
 * Must stay under setTimeout's 32-bit ceiling (~24.8 days): react-query
 * schedules garbage collection with `setTimeout(gcTime)`, and a larger delay
 * overflows and fires *immediately*, evicting every query the moment it loses
 * its last observer — including the ones just restored from disk, before any
 * component can read them. On-disk lifetime is governed by `maxAge` above, so
 * a week in memory is plenty.
 */
const GC_TIME_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Query roots that are safe and useful to keep on the device. Anything not
 * listed here is never written to disk: one-shot results (OCR, presigned
 * uploads), pairing secrets from scale-devices, and anything that would be
 * misleading when stale.
 */
const PERSISTED_QUERY_ROOTS = new Set([
  "me",
  "my-tenants",
  "animals",
  "animals-by-id",
  "animals-list",
  "animals-list-all",
  "animal",
  "animal-detail",
  "animal-statuses",
  "breeds",
  "lots",
  "buyers",
  "milk-prices",
  "milk-productions",
  "milk-deliveries",
  "tenant-billing",
  "tenant-settings",
  "tenant-identity",
  "dashboard",
]);

/** `sub` claim of the access token, without pulling in a JWT library. */
function getUserIdFromToken(): string {
  const token = getToken();
  if (!token) return "anon";
  try {
    const payload = token.split(".")[1];
    if (!payload) return "anon";
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return (JSON.parse(json)?.sub as string) ?? "anon";
  } catch {
    return "anon";
  }
}

/**
 * The cache is scoped to user + farm.
 *
 * This is a correctness and privacy requirement, not a nicety: the app is
 * multi-tenant (`X-Tenant-ID`), so a single shared key would show farm A's
 * animals to whoever opens farm B next. Computing the key on every access —
 * instead of freezing it at mount — means switching farms switches caches
 * without a reload.
 */
function scopedKey(baseKey: string): string {
  return `${baseKey}::${getUserIdFromToken()}::${getTenantId() ?? "no-tenant"}`;
}

const idbStorage = {
  getItem: (key: string) => get<string>(scopedKey(key)).then((v) => v ?? null),
  setItem: (key: string, value: string) => set(scopedKey(key), value),
  removeItem: (key: string) => del(scopedKey(key)),
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /**
       * `offlineFirst` instead of the default `online`: react-query would
       * otherwise pause queries while offline and leave the screen empty. We
       * want it to try, fail fast, and fall back to whatever is cached.
       */
      networkMode: "offlineFirst",
      staleTime: 5 * 60 * 1000,
      gcTime: GC_TIME_MS,
      // Retrying a request that failed because there is no network just burns
      // battery: the connectivity listener will refetch when we are back.
      retry: (failureCount, error) =>
        isNetworkError(error) ? false : failureCount < 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      // Writes are owned by the outbox, which decides what to queue and when to
      // replay. react-query must not silently pause or retry them behind it.
      networkMode: "always",
      retry: false,
    },
  },
});

const rawPersister = createAsyncStoragePersister({
  storage: idbStorage,
  key: CACHE_KEY,
  throttleTime: 2000,
});

/**
 * Refuses to write an empty cache over a populated one.
 *
 * Without this, a cache that is momentarily empty — a cold boot before restore
 * finishes, or a `clear()` — is written straight to disk and destroys the very
 * data offline mode depends on. Wiping the store is only ever done explicitly,
 * through `purgeScopedQueryCache`.
 */
const persister: Persister = {
  ...rawPersister,
  persistClient: (client) =>
    client.clientState.queries.length === 0
      ? Promise.resolve()
      : rawPersister.persistClient(client),
};

export const persistOptions: Omit<PersistQueryClientOptions, "queryClient"> = {
  persister,
  maxAge: MAX_AGE_MS,
  buster: CACHE_VERSION,
  dehydrateOptions: {
    shouldDehydrateQuery: (query: Query) => {
      const root = query.queryKey?.[0];
      if (typeof root !== "string" || !PERSISTED_QUERY_ROOTS.has(root)) {
        return false;
      }
      /**
       * Keep anything that HAS data, even when the latest refetch failed.
       * Requiring `status === "success"` was actively harmful: offline every
       * refetch errors, so the store was rewritten empty exactly when the
       * cached copy was the only thing left to show.
       */
      return query.state.data !== undefined;
    },
  },
};

/**
 * Re-hydrates from the store for whatever scope is now current.
 *
 * `PersistQueryClientProvider` only restores once, at mount, so switching farms
 * would otherwise leave the new farm with an empty cache until the network
 * answers — exactly the situation this whole feature exists to avoid.
 */
export async function restoreScopedQueryCache(): Promise<void> {
  try {
    await persistQueryClientRestore({ queryClient, ...persistOptions });
  } catch (err) {
    console.warn("No se pudo restaurar la caché persistida", err);
  }
}

/** Drops the persisted cache for the user+farm currently in scope. */
export async function purgeScopedQueryCache(): Promise<void> {
  try {
    await idbStorage.removeItem(CACHE_KEY);
  } catch {
    // Storage may be unavailable (private mode, evicted); nothing to do.
  }
}
