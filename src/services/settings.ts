import { apiFetch } from "./client";

export interface TenantBillingSettings {
  default_buyer_id?: string | null;
  default_density?: string; // decimal as string ok
  default_delivery_input_unit?: string;
  default_production_input_unit?: string;
  default_currency?: string;
  default_price_per_l?: string | null;
  updated_at?: string;
}

export async function getBillingSettings() {
  return apiFetch<TenantBillingSettings>("/api/v1/settings/billing", {
    withAuth: true,
    withTenant: true,
  });
}
