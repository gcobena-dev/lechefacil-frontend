import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getTenantId } from "@/services/config";
import { useQuery } from "@tanstack/react-query";
import { myTenants } from "@/services/auth";

export function RequireTenant({ children }: { children: ReactNode }) {
  const location = useLocation();
  const tenant = getTenantId();

  const { data: memberships, isLoading } = useQuery({
    queryKey: ["my-tenants"],
    queryFn: myTenants,
    enabled: !tenant, // Only fetch if no tenant is set
  });

  // Show loading while fetching memberships
  if (!tenant && isLoading) {
    return <div>Loading...</div>;
  }

  // If no tenant is set, check memberships
  if (!tenant) {
    const membershipCount = memberships?.length ?? 0;

    if (membershipCount === 0) {
      return <Navigate to="/request-access" replace state={{ from: location }} />;
    } else if (membershipCount === 1) {
      // Auto-select the single tenant
      const singleMembership = memberships![0];
      localStorage.setItem("lf_tenant_id", singleMembership.tenant_id);
      // Redirect to dashboard or password change if needed
      const mustChangePassword = localStorage.getItem('lf_must_change_password') === 'true';
      return <Navigate to={mustChangePassword ? "/force-change-password" : "/dashboard"} replace />;
    } else {
      return <Navigate to="/select-farm" replace state={{ from: location }} />;
    }
  }

  return <>{children}</>;
}

