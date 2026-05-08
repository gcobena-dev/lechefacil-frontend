import { useQuery } from "@tanstack/react-query";
import { getProfile } from "@/services/auth";

export function useIsSuperAdmin(): { isSuperAdmin: boolean; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ["auth-profile"],
    queryFn: getProfile,
    retry: false,
    staleTime: 60_000,
  });
  return { isSuperAdmin: !!data?.is_super_admin, isLoading };
}
