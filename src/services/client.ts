import {
  requireApiUrl,
  getToken,
  getTenantId,
  TENANT_HEADER,
  setToken,
  setMustChangePassword,
} from "./config";
import { refreshAccess } from "./auth";
import { notifySessionExpired } from "./session";
import { reportApiResult } from "./connectivity";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiError extends Error {
  status?: number;
  details?: unknown;
  /**
   * True when the request never reached the server: no signal, captive portal
   * (e.g. the "Balanza" WiFi), DNS failure or timeout. This is the flag the
   * offline outbox uses to decide "queue it and retry later" instead of
   * "reject it and tell the user they typed something wrong".
   */
  isNetworkError?: boolean;
}

/** True when the failure was the connection, not the server's answer. */
export function isNetworkError(error: unknown): boolean {
  return Boolean((error as ApiError | null)?.isNetworkError);
}

/**
 * Requests that hang forever are indistinguishable from being offline for the
 * person holding the phone, so every call gets a deadline. Slow endpoints (OCR)
 * raise it explicitly via `timeoutMs`.
 */
const DEFAULT_TIMEOUT_MS = 30_000;

async function fetchOrThrowNetworkError(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    // A response of any status proves the server is reachable.
    reportApiResult(true);
    return res;
  } catch (cause) {
    const timedOut = (cause as Error)?.name === "AbortError";
    const err: ApiError = new Error(
      timedOut
        ? "Tiempo de espera agotado al contactar el servidor"
        : "Sin conexión con el servidor"
    );
    err.isNetworkError = true;
    (err as Error & { cause?: unknown }).cause = cause;
    reportApiResult(false);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export async function apiFetch<T>(
  path: string,
  options: {
    method?: HttpMethod;
    headers?: Record<string, string>;
    body?: any;
    query?: Record<string, string | number | boolean | undefined | null>;
    withAuth?: boolean;
    withTenant?: boolean;
    withCredentials?: boolean;
    timeoutMs?: number;
    /**
     * Send this farm instead of the one currently selected. The offline outbox
     * needs it: a record typed in farm A must still be sent as farm A even if
     * the user has switched to farm B before regaining signal.
     */
    tenantId?: string;
  } = {}
): Promise<T> {
  const baseUrl = requireApiUrl();
  const url = new URL(path, baseUrl);
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  // Query params
  if (options.query) {
    Object.entries(options.query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        url.searchParams.set(k, String(v));
      }
    });
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
  };

  if (options.withAuth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  if (options.withTenant) {
    const tenantId = options.tenantId ?? getTenantId();
    if (tenantId) headers[TENANT_HEADER] = tenantId;
  }

  let res = await fetchOrThrowNetworkError(
    url.toString(),
    {
      method: options.method ?? "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      credentials: options.withCredentials ? "include" : undefined,
    },
    timeoutMs
  );

  if (!res.ok) {
    let details: unknown = undefined;
    try {
      details = await res.json();
    } catch (_e) {
      // ignore JSON parse errors when extracting error details
    }
    // Attempt refresh once on 401 for authenticated requests
    if (res.status === 401 && options.withAuth) {
      let refreshData;
      try {
        refreshData = await refreshAccess();
      } catch (e) {
        // The session is only unrecoverable when the server itself rejected the
        // refresh (401/403). A network failure or a 5xx must not log anybody out.
        const refreshStatus = (e as ApiError)?.status;
        if (refreshStatus === 401 || refreshStatus === 403) notifySessionExpired();
        // Losing the connection mid-refresh is a network problem, not an auth
        // one: keep the flag so the outbox retries instead of discarding data.
        const err: ApiError = new Error(`HTTP ${res.status}`);
        err.status = res.status;
        err.details = details;
        if (isNetworkError(e)) err.isNetworkError = true;
        throw err;
      }

      setToken(refreshData.access_token);

      // Update must_change_password flag from refresh response
      setMustChangePassword(refreshData.must_change_password);

      // If user has multiple memberships and no tenant is set, they might need to select farm
      if (
        refreshData.memberships &&
        refreshData.memberships.length > 1 &&
        !getTenantId()
      ) {
        // This could redirect to farm selection, but for now we'll continue with the request
        console.warn(
          "Multiple memberships found, user might need to select farm"
        );
      }

      // retry original request with new token
      const retryHeaders = { ...headers };
      retryHeaders["Authorization"] = `Bearer ${refreshData.access_token}`;
      res = await fetchOrThrowNetworkError(
        url.toString(),
        {
          method: options.method ?? "GET",
          headers: retryHeaders,
          body: options.body ? JSON.stringify(options.body) : undefined,
          credentials: options.withCredentials ? "include" : undefined,
        },
        timeoutMs
      );
      if (!res.ok) {
        const err: ApiError = new Error(`HTTP ${res.status}`);
        err.status = res.status;
        try {
          err.details = await res.json();
        } catch (_e) {
          // ignore JSON parse errors when extracting retry error details
        }
        // Rejected again with a brand new token: the session is gone
        if (res.status === 401) notifySessionExpired();
        throw err;
      }
    } else {
      const err: ApiError = new Error(`HTTP ${res.status}`);
      err.status = res.status;
      err.details = details;
      throw err;
    }
  }

  if (res.status === 204) {
    return undefined as unknown as T;
  }

  return (await res.json()) as T;
}
