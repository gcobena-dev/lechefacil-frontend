import { apiFetch } from "./client";

export interface SemenInventoryResponse {
  id: string;
  tenant_id: string;
  sire_catalog_id: string;
  batch_code: string | null;
  tank_id: string | null;
  canister_position: string | null;
  initial_quantity: number;
  current_quantity: number;
  supplier: string | null;
  cost_per_straw: number | null;
  currency: string;
  purchase_date: string | null;
  expiry_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface SemenInventoryListResponse {
  items: SemenInventoryResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateSemenStockPayload {
  sire_catalog_id: string;
  initial_quantity: number;
  batch_code?: string | null;
  tank_id?: string | null;
  canister_position?: string | null;
  supplier?: string | null;
  cost_per_straw?: number | null;
  currency?: string;
  purchase_date?: string | null;
  expiry_date?: string | null;
  notes?: string | null;
}

export interface UpdateSemenStockPayload {
  batch_code?: string | null;
  tank_id?: string | null;
  canister_position?: string | null;
  current_quantity?: number;
  supplier?: string | null;
  cost_per_straw?: number | null;
  currency?: string;
  purchase_date?: string | null;
  expiry_date?: string | null;
  notes?: string | null;
}

export async function listSemenStock(params?: {
  sire_catalog_id?: string;
  in_stock_only?: boolean;
  limit?: number;
  offset?: number;
}) {
  return apiFetch<SemenInventoryListResponse>("/api/v1/reproduction/semen", {
    withAuth: true,
    withTenant: true,
    query: {
      sire_catalog_id: params?.sire_catalog_id,
      in_stock_only: params?.in_stock_only,
      limit: params?.limit,
      offset: params?.offset,
    },
  });
}

export async function getSemenStock(id: string) {
  return apiFetch<SemenInventoryResponse>(`/api/v1/reproduction/semen/${id}`, {
    withAuth: true,
    withTenant: true,
  });
}

export async function createSemenStock(payload: CreateSemenStockPayload) {
  return apiFetch<SemenInventoryResponse>("/api/v1/reproduction/semen", {
    method: "POST",
    withAuth: true,
    withTenant: true,
    body: payload,
  });
}

export async function updateSemenStock(
  id: string,
  payload: UpdateSemenStockPayload
) {
  return apiFetch<SemenInventoryResponse>(
    `/api/v1/reproduction/semen/${id}`,
    {
      method: "PUT",
      withAuth: true,
      withTenant: true,
      body: payload,
    }
  );
}

export async function deleteSemenStock(id: string) {
  return apiFetch<void>(`/api/v1/reproduction/semen/${id}`, {
    method: "DELETE",
    withAuth: true,
    withTenant: true,
  });
}
