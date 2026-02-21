import { apiFetch } from "./client";

export interface HealthRecordResponse {
  id: string;
  tenant_id: string;
  animal_id: string;
  event_type: "VACCINATION" | "TREATMENT" | "VET_OBSERVATION" | "EMERGENCY";
  occurred_at: string;
  veterinarian?: string | null;
  cost?: number | null;
  notes?: string | null;
  vaccine_name?: string | null;
  next_dose_date?: string | null;
  medication?: string | null;
  duration_days?: number | null;
  withdrawal_days?: number | null;
  withdrawal_until?: string | null;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface HealthRecordListResponse {
  items: HealthRecordResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateHealthRecordPayload {
  event_type: "VACCINATION" | "TREATMENT" | "VET_OBSERVATION" | "EMERGENCY";
  occurred_at: string; // ISO datetime
  veterinarian?: string | null;
  cost?: number | null;
  notes?: string | null;
  vaccine_name?: string | null;
  next_dose_date?: string | null; // YYYY-MM-DD
  medication?: string | null;
  duration_days?: number | null;
  withdrawal_days?: number | null;
}

export interface UpdateHealthRecordPayload {
  occurred_at?: string;
  veterinarian?: string | null;
  cost?: number | null;
  notes?: string | null;
  vaccine_name?: string | null;
  next_dose_date?: string | null;
  medication?: string | null;
  duration_days?: number | null;
  withdrawal_days?: number | null;
}

export async function listHealthRecords(
  animalId: string,
  params?: { limit?: number; offset?: number }
) {
  return apiFetch<HealthRecordListResponse>(
    `/api/v1/animals/${animalId}/health`,
    {
      withAuth: true,
      withTenant: true,
      query: {
        limit: params?.limit,
        offset: params?.offset,
      },
    }
  );
}

export async function getHealthRecord(animalId: string, recordId: string) {
  return apiFetch<HealthRecordResponse>(
    `/api/v1/animals/${animalId}/health/${recordId}`,
    {
      withAuth: true,
      withTenant: true,
    }
  );
}

export async function createHealthRecord(
  animalId: string,
  payload: CreateHealthRecordPayload
) {
  return apiFetch<HealthRecordResponse>(`/api/v1/animals/${animalId}/health`, {
    method: "POST",
    withAuth: true,
    withTenant: true,
    body: payload,
  });
}

export async function updateHealthRecord(
  animalId: string,
  recordId: string,
  payload: UpdateHealthRecordPayload
) {
  return apiFetch<HealthRecordResponse>(
    `/api/v1/animals/${animalId}/health/${recordId}`,
    {
      method: "PUT",
      withAuth: true,
      withTenant: true,
      body: payload,
    }
  );
}

export async function deleteHealthRecord(animalId: string, recordId: string) {
  return apiFetch<void>(`/api/v1/animals/${animalId}/health/${recordId}`, {
    method: "DELETE",
    withAuth: true,
    withTenant: true,
  });
}
