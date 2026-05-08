import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { setTenantId } from "@/services/config";

export function useSwitchTenant() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useCallback(
    (tenantId: string, opts?: { redirectTo?: string }) => {
      setTenantId(tenantId);
      queryClient.clear();
      navigate(opts?.redirectTo ?? "/dashboard");
    },
    [queryClient, navigate]
  );
}
