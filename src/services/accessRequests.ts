import { apiFetch } from "./client";
import type { AccessRequestDetail, AccessRequestList, AccessRequestStatus, UUID } from "./types";

export interface SubmitAccessRequestPayload {
  full_name: string;
  email: string;
  phone_number?: string | null;
  farm_name: string;
  farm_location?: string | null;
  requested_role: string;
  message?: string | null;
}

export async function submitAccessRequest(
  payload: SubmitAccessRequestPayload
): Promise<{ id: UUID; status: string }> {
  return apiFetch<{ id: UUID; status: string }>("/api/v1/access-requests/", {
    method: "POST",
    body: payload,
    withAuth: true,
  });
}

export async function listAccessRequests(params: {
  status?: AccessRequestStatus;
  limit?: number;
  offset?: number;
}): Promise<AccessRequestList> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.offset !== undefined) query.set("offset", String(params.offset));
  const qs = query.toString();
  return apiFetch<AccessRequestList>(
    `/api/v1/access-requests/${qs ? `?${qs}` : ""}`,
    { withAuth: true }
  );
}

export async function getAccessRequest(id: UUID): Promise<AccessRequestDetail> {
  return apiFetch<AccessRequestDetail>(`/api/v1/access-requests/${id}`, {
    withAuth: true,
  });
}

export async function approveAccessRequest(
  id: UUID,
  notes?: string
): Promise<AccessRequestDetail> {
  return apiFetch<AccessRequestDetail>(`/api/v1/access-requests/${id}/approve`, {
    method: "POST",
    body: notes ? { notes } : {},
    withAuth: true,
  });
}

export async function rejectAccessRequest(
  id: UUID,
  notes?: string
): Promise<AccessRequestDetail> {
  return apiFetch<AccessRequestDetail>(`/api/v1/access-requests/${id}/reject`, {
    method: "POST",
    body: notes ? { notes } : {},
    withAuth: true,
  });
}
