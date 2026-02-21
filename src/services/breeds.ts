import { apiFetch } from "./client";

export interface BreedResponse {
  id: string;
  name: string;
  code?: string | null;
  is_system_default: boolean;
  active: boolean;
  metadata?: Record<string, unknown> | null;
}

export async function getBreeds(params?: { active?: boolean }) {
  return apiFetch<BreedResponse[]>("/api/v1/breeds/", {
    withAuth: true,
    withTenant: true,
    query: {
      active: params?.active,
    },
  });
}

export async function createBreed(payload: {
  name: string;
  active?: boolean;
  metadata?: Record<string, unknown> | null;
}) {
  return apiFetch<BreedResponse>("/api/v1/breeds/", {
    method: "POST",
    withAuth: true,
    withTenant: true,
    body: payload,
  });
}

export async function updateBreed(
  id: string,
  payload: Partial<{
    name: string;
    active: boolean;
    metadata: Record<string, unknown> | null;
  }>
) {
  return apiFetch<BreedResponse>(`/api/v1/breeds/${id}`, {
    method: "PUT",
    withAuth: true,
    withTenant: true,
    body: payload,
  });
}

export async function deleteBreed(id: string) {
  return apiFetch<void>(`/api/v1/breeds/${id}`, {
    method: "DELETE",
    withAuth: true,
    withTenant: true,
  });
}
