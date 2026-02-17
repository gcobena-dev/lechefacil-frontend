import { apiFetch } from "./client";

export interface InseminationResponse {
  id: string;
  tenant_id: string;
  animal_id: string;
  animal_tag: string | null;
  animal_name: string | null;
  sire_catalog_id: string | null;
  sire_name: string | null;
  semen_inventory_id: string | null;
  service_event_id: string | null;
  service_date: string;
  method: string;
  technician: string | null;
  straw_count: number;
  heat_detected: boolean;
  protocol: string | null;
  pregnancy_status: string;
  pregnancy_check_date: string | null;
  pregnancy_checked_by: string | null;
  expected_calving_date: string | null;
  calving_event_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface InseminationListResponse {
  items: InseminationResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateInseminationPayload {
  animal_id: string;
  service_date: string;
  method: string;
  sire_catalog_id?: string | null;
  semen_inventory_id?: string | null;
  technician?: string | null;
  straw_count?: number;
  heat_detected?: boolean;
  protocol?: string | null;
  notes?: string | null;
}

export interface PregnancyCheckPayload {
  result: string;
  check_date: string;
  checked_by?: string | null;
}

export async function listInseminations(params?: {
  animal_id?: string;
  sire_catalog_id?: string;
  pregnancy_status?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
  sort_by?: string;
  sort_dir?: string;
}) {
  return apiFetch<InseminationListResponse>(
    "/api/v1/reproduction/inseminations",
    {
      withAuth: true,
      withTenant: true,
      query: {
        animal_id: params?.animal_id,
        sire_catalog_id: params?.sire_catalog_id,
        pregnancy_status: params?.pregnancy_status,
        date_from: params?.date_from,
        date_to: params?.date_to,
        limit: params?.limit,
        offset: params?.offset,
        sort_by: params?.sort_by,
        sort_dir: params?.sort_dir,
      },
    }
  );
}

export async function getInsemination(id: string) {
  return apiFetch<InseminationResponse>(
    `/api/v1/reproduction/inseminations/${id}`,
    {
      withAuth: true,
      withTenant: true,
    }
  );
}

export async function createInsemination(payload: CreateInseminationPayload) {
  return apiFetch<InseminationResponse>(
    "/api/v1/reproduction/inseminations",
    {
      method: "POST",
      withAuth: true,
      withTenant: true,
      body: payload,
    }
  );
}

export async function updateInsemination(
  id: string,
  payload: { technician?: string; notes?: string; heat_detected?: boolean; protocol?: string }
) {
  return apiFetch<InseminationResponse>(
    `/api/v1/reproduction/inseminations/${id}`,
    {
      method: "PUT",
      withAuth: true,
      withTenant: true,
      body: payload,
    }
  );
}

export async function deleteInsemination(id: string) {
  return apiFetch<void>(
    `/api/v1/reproduction/inseminations/${id}`,
    {
      method: "DELETE",
      withAuth: true,
      withTenant: true,
    }
  );
}

export async function recordPregnancyCheck(
  inseminationId: string,
  payload: PregnancyCheckPayload
) {
  return apiFetch<InseminationResponse>(
    `/api/v1/reproduction/inseminations/${inseminationId}/pregnancy-check`,
    {
      method: "POST",
      withAuth: true,
      withTenant: true,
      body: payload,
    }
  );
}

export async function getPendingPregnancyChecks(params?: {
  min_days?: number;
  max_days?: number;
}) {
  return apiFetch<InseminationResponse[]>(
    "/api/v1/reproduction/inseminations/pending-checks",
    {
      withAuth: true,
      withTenant: true,
      query: {
        min_days: params?.min_days,
        max_days: params?.max_days,
      },
    }
  );
}
