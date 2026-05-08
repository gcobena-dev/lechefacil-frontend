import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useIsSuperAdmin } from "@/hooks/useIsSuperAdmin";

export function RequireSuperAdmin({ children }: { children: ReactNode }) {
  const { isSuperAdmin, isLoading } = useIsSuperAdmin();
  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Verificando permisos…</div>;
  }
  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}
