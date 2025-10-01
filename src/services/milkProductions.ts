import { apiFetch } from "./client";

export interface MilkProductionItem {
  id: string;
  animal_id?: string | null;
  buyer_id?: string | null;
  date_time: string;
  shift: string;
  input_unit: string;
  input_quantity: string; // decimal
  density: string; // decimal
  volume_l: string; // decimal
  price_snapshot?: string | null;
  currency: string;
  amount?: string | null;
}

export interface MilkProductionListResponse {
  items: MilkProductionItem[];
  total: number;
  limit: number;
  offset: number;
}

export async function listMilkProductions(params: { date_from?: string; date_to?: string; animal_id?: string; limit?: number; offset?: number }) {
  // Backward-compatible helper that returns only items
  const resp = await apiFetch<MilkProductionListResponse>("/api/v1/milk-productions/", {
    withAuth: true,
    withTenant: true,
    query: {
      date_from: params.date_from,
      date_to: params.date_to,
      animal_id: params.animal_id,
      limit: params.limit,
      offset: params.offset,
    },
  });
  return resp.items;
}

export async function createMilkProduction(payload: {
  date?: string; // YYYY-MM-DD
  shift?: 'AM' | 'PM';
  date_time?: string; // ISO
  animal_id: string;
  input_unit: 'l' | 'kg' | 'lb';
  input_quantity: number | string;
  density?: number | string | null;
  buyer_id?: string | null;
  notes?: string | null;
}) {
  return apiFetch<MilkProductionItem>("/api/v1/milk-productions/", {
    method: "POST",
    withAuth: true,
    withTenant: true,
    body: payload,
  });
}

export async function createMilkProductionsBulk(payload: {
  date?: string; // YYYY-MM-DD
  shift?: 'AM' | 'PM';
  date_time?: string; // ISO
  input_unit?: 'l' | 'kg' | 'lb';
  density?: number | string | null;
  buyer_id?: string | null;
  notes?: string | null;
  items: { animal_id: string; input_quantity: number | string }[];
}) {
  return apiFetch<MilkProductionItem[]>("/api/v1/milk-productions/bulk", {
    method: "POST",
    withAuth: true,
    withTenant: true,
    body: payload,
  });
}

export async function listMilkProductionsPaginated(params: { date_from?: string; date_to?: string; animal_id?: string; limit?: number; offset?: number }) {
  return apiFetch<MilkProductionListResponse>("/api/v1/milk-productions/", {
    withAuth: true,
    withTenant: true,
    query: {
      date_from: params.date_from,
      date_to: params.date_to,
      animal_id: params.animal_id,
      limit: params.limit,
      offset: params.offset,
    },
  });
}
