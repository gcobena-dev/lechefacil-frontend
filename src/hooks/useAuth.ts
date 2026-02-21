import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/services/client";
import { MeResponse } from "@/services/types";

type UserProfile = MeResponse;

// Get current user profile with role information
export async function getUserProfile(): Promise<UserProfile> {
  return apiFetch<UserProfile>("/api/v1/me", {
    method: "GET",
    withAuth: true,
    withTenant: true,
  });
}

export function useUserProfile() {
  return useQuery<UserProfile>({
    queryKey: ["auth", "profile"],
    queryFn: getUserProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Helper hook to get current user role
export function useUserRole():
  | "ADMIN"
  | "WORKER"
  | "VET"
  | "MANAGER"
  | "VETERINARIAN"
  | undefined {
  const { data } = useUserProfile();
  return data?.active_role;
}

// Helper hook to get current user ID
export function useUserId(): string | undefined {
  const { data } = useUserProfile();
  return data?.user_id;
}

// Helper hook to get current tenant ID
export function useTenantId(): string | undefined {
  const { data } = useUserProfile();
  return data?.active_tenant;
}

// Helper to check if user has specific role
export function useHasRole(
  role: "ADMIN" | "WORKER" | "VET" | "MANAGER" | "VETERINARIAN"
): boolean {
  const userRole = useUserRole();
  return userRole === role;
}

// Helper to check if user is admin (has admin privileges)
export function useIsAdmin(): boolean {
  return useHasRole("ADMIN");
}
