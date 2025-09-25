import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

export function RequirePasswordChange({ children }: { children: ReactNode }) {
  const location = useLocation();
  const must = typeof window !== 'undefined' && localStorage.getItem('lf_must_change_password') === 'true';
  const isForceRoute = location.pathname === '/force-change-password';
  if (must && !isForceRoute) {
    return <Navigate to="/force-change-password" replace />;
  }
  return <>{children}</>;
}

