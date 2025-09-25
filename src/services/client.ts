import { requireApiUrl, getToken, getTenantId, TENANT_HEADER, setToken, setMustChangePassword } from "./config";
import { refreshAccess } from "./auth";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiError extends Error {
  status?: number;
  details?: unknown;
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
  } = {}
): Promise<T> {
  const baseUrl = requireApiUrl();
  const url = new URL(path, baseUrl);

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
    const tenantId = getTenantId();
    if (tenantId) {
      console.log('🔧 DEBUG: Adding tenant header:', TENANT_HEADER, '=', tenantId);
      headers[TENANT_HEADER] = tenantId;
    }
  }

  console.log('🔧 DEBUG: Final headers:', headers);
  console.log('🔧 DEBUG: URL:', url.toString());

  let res = await fetch(url.toString(), {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    let details: unknown = undefined;
    try {
      details = await res.json();
    } catch {}
    // Attempt refresh once on 401 for authenticated requests
    if (res.status === 401 && options.withAuth) {
      try {
        const refreshData = await refreshAccess();
        setToken(refreshData.access_token);

        // Update must_change_password flag from refresh response
        setMustChangePassword(refreshData.must_change_password);

        // If user has multiple memberships and no tenant is set, they might need to select farm
        if (refreshData.memberships && refreshData.memberships.length > 1 && !getTenantId()) {
          // This could redirect to farm selection, but for now we'll continue with the request
          console.warn("Multiple memberships found, user might need to select farm");
        }

        // retry original request with new token
        const retryHeaders = { ...headers };
        retryHeaders["Authorization"] = `Bearer ${refreshData.access_token}`;
        res = await fetch(url.toString(), {
          method: options.method ?? "GET",
          headers: retryHeaders,
          body: options.body ? JSON.stringify(options.body) : undefined,
        });
        if (!res.ok) {
          const err: ApiError = new Error(`HTTP ${res.status}`);
          err.status = res.status;
          try { err.details = await res.json(); } catch {}
          throw err;
        }
      } catch (e) {
        const err: ApiError = new Error(`HTTP ${res.status}`);
        err.status = res.status;
        err.details = details;
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
