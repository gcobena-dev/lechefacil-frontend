import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { setTenantId } from "@/services/config";
import { restoreScopedQueryCache } from "@/lib/queryClient";

export function useSwitchTenant() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useCallback(
    (tenantId: string, opts?: { redirectTo?: string }) => {
      setTenantId(tenantId);
      // Drop the previous farm's data, then bring in whatever we already have
      // cached for the new one so the screen is usable with no signal.
      queryClient.clear();
      void restoreScopedQueryCache();
      navigate(opts?.redirectTo ?? "/dashboard");
    },
    [queryClient, navigate]
  );
}
