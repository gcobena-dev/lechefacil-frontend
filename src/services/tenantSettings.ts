import { apiFetch } from "./client";

export interface TenantSettings {
  default_buyer_id: string | null;
  default_density: number;
  default_delivery_input_unit: string;
  default_production_input_unit: string;
  default_currency: string;
  default_price_per_l: number;
}

export type UpdateTenantSettingsPayload = TenantSettings;

export async function getTenantSettings(): Promise<TenantSettings> {
  return apiFetch<TenantSettings>("/api/v1/settings/billing", {
    withAuth: true,
    withTenant: true,
  });
}

export async function updateTenantSettings(
  payload: UpdateTenantSettingsPayload
): Promise<TenantSettings> {
  return apiFetch<TenantSettings>("/api/v1/settings/billing", {
    method: "PUT",
    withAuth: true,
    withTenant: true,
    body: payload,
  });
}

export interface TenantIdentity {
  tenant_id: string;
  name: string;
  location: string | null;
}

export async function getTenantIdentity(): Promise<TenantIdentity> {
  return apiFetch<TenantIdentity>("/api/v1/settings/tenant", {
    withAuth: true,
    withTenant: true,
  });
}

export async function updateTenantIdentity(payload: {
  name?: string;
  location?: string | null;
}): Promise<TenantIdentity> {
  return apiFetch<TenantIdentity>("/api/v1/settings/tenant", {
    method: "PATCH",
    withAuth: true,
    withTenant: true,
    body: payload,
  });
}
