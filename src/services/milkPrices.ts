import { apiFetch } from "./client";
import { MilkPriceResponse } from "./types";

export async function listMilkPrices(params?: {
  date_from?: string;
  date_to?: string;
  buyer_id?: string | null;
}) {
  return apiFetch<MilkPriceResponse[]>("/api/v1/milk-prices/", {
    withAuth: true,
    withTenant: true,
    query: {
      date_from: params?.date_from,
      date_to: params?.date_to,
      buyer_id: params?.buyer_id ?? undefined,
    },
  });
}

export async function createMilkPrice(payload: {
  date: string;
  price_per_l: string | number;
  currency?: string;
  buyer_id: string;
}) {
  return apiFetch<MilkPriceResponse>("/api/v1/milk-prices/", {
    method: "POST",
    withAuth: true,
    withTenant: true,
    body: payload,
  });
}

export async function updateMilkPrice(
  id: string,
  payload: Partial<{
    date: string;
    price_per_l: string | number;
    currency: string;
    buyer_id: string | null;
  }>
) {
  return apiFetch<MilkPriceResponse>(`/api/v1/milk-prices/${id}`, {
    method: "PUT",
    withAuth: true,
    withTenant: true,
    body: payload,
  });
}

export async function deleteMilkPrice(id: string) {
  return apiFetch<void>(`/api/v1/milk-prices/${id}`, {
    method: "DELETE",
    withAuth: true,
    withTenant: true,
  });
}
