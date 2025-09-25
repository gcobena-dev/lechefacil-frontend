import { apiFetch } from "./client";
import { BuyerResponse } from "./types";

export async function listBuyers() {
  return apiFetch<BuyerResponse[]>("/api/v1/buyers/", {
    withAuth: true,
    withTenant: true,
  });
}

export async function createBuyer(payload: { name: string; code?: string | null; contact?: string | null; is_active?: boolean }) {
  return apiFetch<BuyerResponse>("/api/v1/buyers/", {
    method: "POST",
    withAuth: true,
    withTenant: true,
    body: payload,
  });
}
