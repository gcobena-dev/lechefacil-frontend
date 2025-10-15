import { apiFetch } from "./client";
import { requireApiUrl, getTenantId, getRefreshToken, setRefreshToken } from "./config";
import { isMobileClient } from "@/utils/device";
import { LoginResponse, MeResponse, Membership } from "./types";

export async function login(payload: {
  email: string;
  password: string;
  tenant_id?: string | null;
}): Promise<LoginResponse> {
  const isMobile = isMobileClient();
  const res = await apiFetch<LoginResponse>("/api/v1/auth/login", {
    method: "POST",
    body: payload,
    // Important: allow backend to set HttpOnly refresh cookie
    withCredentials: true,
    headers: isMobile ? { 'X-Mobile-Client': '1' } : undefined,
  });
  const rtLogin = (res as any)?.refresh_token;
  if (rtLogin) {
    try { setRefreshToken(rtLogin); } catch { void 0; }
  }
  return res;
}

export async function me(): Promise<MeResponse> {
  return apiFetch<MeResponse>("/api/v1/me", {
    withAuth: true,
    withTenant: true,
  });
}

export async function myTenants(): Promise<Membership[]> {
  return apiFetch<Membership[]>("/api/v1/auth/my-tenants", {
    withAuth: true,
  });
}

export async function registerTenant(payload: { email: string; password: string; tenant_id?: string | null }) {
  return apiFetch<{ user_id: string; email: string; tenant_id: string }>("/api/v1/auth/register-tenant", {
    method: "POST",
    body: payload,
  });
}

export async function signin(payload: { email: string; password: string }) {
  return apiFetch<{ user_id: string; email: string }>("/api/v1/auth/signin", {
    method: "POST",
    body: payload,
  });
}

export async function refreshAccess(): Promise<LoginResponse> {
  // include credentials so cookie is sent
  const base = requireApiUrl();
  const url = new URL("/api/v1/auth/refresh", base).toString();
  const tenantId = getTenantId();
  const headers: Record<string, string> = { 'Accept': 'application/json' };
  const isMobile = isMobileClient();
  if (isMobile) headers['X-Mobile-Client'] = '1';
  if (tenantId) headers['X-Tenant-ID'] = tenantId;
  const rt = getRefreshToken();
  if (rt) headers['Authorization'] = `Bearer ${rt}`;
  const body = rt ? JSON.stringify({ refresh_token: rt }) : undefined;
  const res = await fetch(url, {
    method: "POST",
    headers,
    credentials: "include",
    body,
  });
  if (!res.ok) throw new Error("refresh_failed");
  const data = await res.json();
  const rtNew = (data as any)?.refresh_token;
  if (rtNew) {
    try { setRefreshToken(rtNew); } catch { void 0; }
  }
  return data as LoginResponse;
}

export async function logoutServer(): Promise<void> {
  const base = requireApiUrl();
  const url = new URL("/api/v1/auth/logout", base).toString();
  const tenantId = getTenantId();
  const headers: Record<string, string> = { 'Accept': 'application/json' };
  if (tenantId) headers['X-Tenant-ID'] = tenantId;
  await fetch(url, {
    method: "POST",
    headers,
    credentials: "include",
  });
}

// Unified logout utility to avoid duplicating logic in components
import { logout as clearLocalSession } from "./config";
import { unregisterPushNotifications } from "./push";
export async function performLogout(): Promise<void> {
  try {
    // Try to unregister push token first (best-effort)
    await unregisterPushNotifications();
    await logoutServer();
  } catch (_) {
    // ignore server logout errors (e.g., no cookie); proceed to clear local
  } finally {
    clearLocalSession();
    try { setRefreshToken(null); } catch { void 0; }
  }
}

export interface AddMembershipPayload {
  tenant_id: string;
  role: string; // must match backend enum values
  email?: string | null;
  user_id?: string | null;
  create_if_missing?: boolean;
  initial_password?: string | null;
}

export async function addMembership(payload: AddMembershipPayload) {
  return apiFetch<{ user_id: string; email: string; tenant_id: string; role: string; created_user: boolean; generated_password?: string | null }>(
    "/api/v1/auth/memberships",
    {
      method: "POST",
      withAuth: true,
      withTenant: true,
      body: payload,
    }
  );
}

export async function changePassword(payload: { current_password: string; new_password: string }) {
  return apiFetch<{ status: string }>("/api/v1/auth/change-password", {
    method: "POST",
    withAuth: true,
    withTenant: true,
    body: payload,
  });
}

export async function requestPasswordReset(payload: { email: string }) {
  return apiFetch<{ status: string }>("/api/v1/auth/forgot-password", {
    method: "POST",
    body: payload,
  });
}

export async function resetPassword(payload: { token: string; new_password: string }) {
  return apiFetch<{ status: string }>("/api/v1/auth/reset-password", {
    method: "POST",
    body: payload,
  });
}
