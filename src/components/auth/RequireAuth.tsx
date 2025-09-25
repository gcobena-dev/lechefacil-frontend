import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getToken } from "@/services/config";

export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const token = getToken();
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <>{children}</>;
}

