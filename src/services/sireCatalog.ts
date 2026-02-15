import { apiFetch } from "./client";

export interface SireCatalogResponse {
  id: string;
  tenant_id: string;
  name: string;
  short_code: string | null;
  registry_code: string | null;
  registry_name: string | null;
  breed_id: string | null;
  animal_id: string | null;
  is_active: boolean;
  genetic_notes: string | null;
  data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface SireCatalogListResponse {
  items: SireCatalogResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface SirePerformanceResponse {
  sire: SireCatalogResponse;
  total_inseminations: number;
  confirmed_pregnancies: number;
  conception_rate: number;
}

export interface CreateSirePayload {
  name: string;
  short_code?: string | null;
  registry_code?: string | null;
  registry_name?: string | null;
  breed_id?: string | null;
  animal_id?: string | null;
  genetic_notes?: string | null;
  data?: Record<string, unknown> | null;
}

export interface UpdateSirePayload {
  name?: string;
  short_code?: string | null;
  registry_code?: string | null;
  registry_name?: string | null;
  breed_id?: string | null;
  animal_id?: string | null;
  is_active?: boolean;
  genetic_notes?: string | null;
  data?: Record<string, unknown> | null;
}

export async function listSires(params?: {
  active_only?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  return apiFetch<SireCatalogListResponse>("/api/v1/reproduction/sires", {
    withAuth: true,
    withTenant: true,
    query: {
      active_only: params?.active_only,
      search: params?.search,
      limit: params?.limit,
      offset: params?.offset,
    },
  });
}

export async function getSire(id: string) {
  return apiFetch<SireCatalogResponse>(`/api/v1/reproduction/sires/${id}`, {
    withAuth: true,
    withTenant: true,
  });
}

export async function createSire(payload: CreateSirePayload) {
  return apiFetch<SireCatalogResponse>("/api/v1/reproduction/sires", {
    method: "POST",
    withAuth: true,
    withTenant: true,
    body: payload,
  });
}

export async function updateSire(id: string, payload: UpdateSirePayload) {
  return apiFetch<SireCatalogResponse>(`/api/v1/reproduction/sires/${id}`, {
    method: "PUT",
    withAuth: true,
    withTenant: true,
    body: payload,
  });
}

export async function deleteSire(id: string) {
  return apiFetch<void>(`/api/v1/reproduction/sires/${id}`, {
    method: "DELETE",
    withAuth: true,
    withTenant: true,
  });
}

export async function getSirePerformance(id: string) {
  return apiFetch<SirePerformanceResponse>(
    `/api/v1/reproduction/sires/${id}/performance`,
    {
      withAuth: true,
      withTenant: true,
    }
  );
}
