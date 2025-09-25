import { apiFetch } from "./client";
import { AnimalResponse, AnimalsListResponse } from "./types";

export async function listAnimals(params?: { cursor?: string; limit?: number; q?: string }) {
  return apiFetch<AnimalsListResponse>("/api/v1/animals/", {
    withAuth: true,
    withTenant: true,
    query: {
      cursor: params?.cursor,
      limit: params?.limit,
      q: params?.q,
    },
  });
}

export async function getAnimal(id: string) {
  return apiFetch<AnimalResponse>(`/api/v1/animals/${id}`, {
    withAuth: true,
    withTenant: true,
  });
}

export async function createAnimal(payload: {
  tag: string;
  name?: string | null;
  breed?: string | null;
  birth_date?: string | null; // YYYY-MM-DD
  lot?: string | null;
  status?: string | null;
  photo_url?: string | null;
}) {
  return apiFetch<AnimalResponse>("/api/v1/animals/", {
    method: "POST",
    withAuth: true,
    withTenant: true,
    body: payload,
  });
}

export async function updateAnimal(id: string, payload: Partial<Omit<AnimalResponse, "id" | "tenant_id" | "created_at" | "updated_at">> & { version: number }) {
  return apiFetch<AnimalResponse>(`/api/v1/animals/${id}`, {
    method: "PUT",
    withAuth: true,
    withTenant: true,
    body: payload,
  });
}

export async function deleteAnimal(id: string) {
  return apiFetch<void>(`/api/v1/animals/${id}`, {
    method: "DELETE",
    withAuth: true,
    withTenant: true,
  });
}

