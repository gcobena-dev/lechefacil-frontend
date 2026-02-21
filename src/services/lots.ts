import { apiFetch } from "./client";
import type { AnimalResponse } from "./types";

export interface LotResponse {
  id: string;
  name: string;
  active: boolean;
  notes?: string | null;
}

export async function getLots(params?: { active?: boolean }) {
  return apiFetch<LotResponse[]>("/api/v1/lots/", {
    withAuth: true,
    withTenant: true,
    query: {
      active: params?.active,
    },
  });
}

export async function createLot(payload: {
  name: string;
  active?: boolean;
  notes?: string | null;
}) {
  return apiFetch<LotResponse>("/api/v1/lots/", {
    method: "POST",
    withAuth: true,
    withTenant: true,
    body: payload,
  });
}

export async function updateLot(
  id: string,
  payload: Partial<{ name: string; active: boolean; notes: string | null }>
) {
  return apiFetch<LotResponse>(`/api/v1/lots/${id}`, {
    method: "PUT",
    withAuth: true,
    withTenant: true,
    body: payload,
  });
}

export async function deleteLot(id: string) {
  return apiFetch<void>(`/api/v1/lots/${id}`, {
    method: "DELETE",
    withAuth: true,
    withTenant: true,
  });
}

export async function assignAnimalLot(
  animalId: string,
  version: number,
  lotId: string | null
) {
  return apiFetch<AnimalResponse>(`/api/v1/animals/${animalId}/lot`, {
    method: "PUT",
    withAuth: true,
    withTenant: true,
    body: { lot_id: lotId, version },
  });
}
