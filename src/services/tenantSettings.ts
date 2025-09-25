import { apiFetch } from "./client";

export interface TenantSettings {
  default_buyer_id: string | null;
  default_density: number;
  default_delivery_input_unit: string;
  default_production_input_unit: string;
  default_currency: string;
  default_price_per_l: number;
}

export interface UpdateTenantSettingsPayload extends TenantSettings {}

export async function getTenantSettings(): Promise<TenantSettings> {
  return apiFetch<TenantSettings>("/api/v1/settings/billing", {
    withAuth: true,
    withTenant: true,
  });
}

export async function updateTenantSettings(payload: UpdateTenantSettingsPayload): Promise<TenantSettings> {
  return apiFetch<TenantSettings>("/api/v1/settings/billing", {
    method: "PUT",
    withAuth: true,
    withTenant: true,
    body: payload,
  });
}