import { apiFetch } from "./client";
import { MilkDeliveryResponse } from "./types";

export interface CreateMilkDeliveryPayload {
  date_time: string; // ISO string
  volume_l: number;
  buyer_id: string;
  notes?: string;
}

export async function listMilkDeliveries(params?: { date_from?: string; date_to?: string; buyer_id?: string | null }) {
  return apiFetch<MilkDeliveryResponse[]>("/api/v1/milk-deliveries/", {
    withAuth: true,
    withTenant: true,
    query: {
      date_from: params?.date_from,
      date_to: params?.date_to,
      buyer_id: params?.buyer_id ?? undefined,
    },
  });
}

export async function createMilkDelivery(payload: CreateMilkDeliveryPayload) {
  return apiFetch<MilkDeliveryResponse>("/api/v1/milk-deliveries/", {
    method: "POST",
    withAuth: true,
    withTenant: true,
    body: payload,
  });
}