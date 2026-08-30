import { apiFetch } from "./client";
import { MilkDeliveryResponse } from "./types";

export interface CreateMilkDeliveryPayload {
  date_time: string; // ISO string
  volume_l: number;
  buyer_id: string;
  notes?: string;
  /**
   * Device-generated UUID, required for safe offline replay. Unlike productions,
   * deliveries have no natural key — the same buyer can receive several loads on
   * the same day — so without this a retry would silently duplicate one.
   */
  client_request_id?: string;
}

export async function listMilkDeliveries(params?: {
  date_from?: string;
  date_to?: string;
  buyer_id?: string | null;
}) {
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

export async function createMilkDelivery(
  payload: CreateMilkDeliveryPayload,
  scope: { tenantId?: string } = {}
) {
  return apiFetch<MilkDeliveryResponse>("/api/v1/milk-deliveries/", {
    method: "POST",
    withAuth: true,
    withTenant: true,
    tenantId: scope.tenantId,
    body: payload,
  });
}

export async function updateMilkDelivery(
  id: string,
  payload: { version: number; volume_l?: number; notes?: string }
) {
  return apiFetch<MilkDeliveryResponse>(`/api/v1/milk-deliveries/${id}`, {
    method: "PUT",
    withAuth: true,
    withTenant: true,
    body: payload,
  });
}
