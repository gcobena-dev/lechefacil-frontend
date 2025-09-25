import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getTenantId } from "@/services/config";

export function RequireTenant({ children }: { children: ReactNode }) {
  const location = useLocation();
  const tenant = getTenantId();
  if (!tenant) {
    return <Navigate to="/select-farm" replace state={{ from: location }} />;
  }
  return <>{children}</>;
}

