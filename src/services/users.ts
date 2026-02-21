import { apiFetch } from "./client";

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

export interface UsersListResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
}

export async function listTenantUsers(
  tenantId: string,
  params: ListUsersParams = {}
): Promise<UsersListResponse> {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined)
    searchParams.set("page", params.page.toString());
  if (params.limit !== undefined)
    searchParams.set("limit", params.limit.toString());
  if (params.role) searchParams.set("role", params.role);
  if (params.search) searchParams.set("search", params.search);

  const queryString = searchParams.toString();
  const url = `/api/v1/tenants/${tenantId}/users${
    queryString ? `?${queryString}` : ""
  }`;

  return apiFetch<UsersListResponse>(url, {
    withAuth: true,
    withTenant: true,
  });
}

export interface RemoveUserMembershipPayload {
  reason?: string;
}

export interface RemoveUserMembershipResponse {
  message: string;
  user_id: string;
  tenant_id: string;
  removed_at: string;
}

export interface UpdateUserRolePayload {
  role: string;
}

export interface UpdateUserRoleResponse {
  message: string;
  user_id: string;
  tenant_id: string;
  role: string;
  updated_at: string;
}

export async function updateUserRole(
  tenantId: string,
  userId: string,
  payload: UpdateUserRolePayload
): Promise<UpdateUserRoleResponse> {
  return apiFetch<UpdateUserRoleResponse>(
    `/api/v1/tenants/${tenantId}/users/${userId}/membership`,
    {
      method: "PATCH",
      withAuth: true,
      withTenant: true,
      body: payload,
    }
  );
}

export async function removeUserMembership(
  tenantId: string,
  userId: string,
  payload: RemoveUserMembershipPayload = {}
): Promise<RemoveUserMembershipResponse> {
  return apiFetch<RemoveUserMembershipResponse>(
    `/api/v1/tenants/${tenantId}/users/${userId}/membership`,
    {
      method: "DELETE",
      withAuth: true,
      withTenant: true,
      body: payload,
    }
  );
}
