import { ReactNode } from 'react';
import { useUserRole, useIsAdmin } from '@/hooks/useAuth';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/hooks/useTranslation';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles?: ('ADMIN' | 'WORKER' | 'VET' | 'MANAGER' | 'VETERINARIAN')[];
  adminOnly?: boolean;
  fallback?: ReactNode;
  hideOnForbidden?: boolean;
}

export default function RoleGuard({
  children,
  allowedRoles,
  adminOnly = false,
  fallback,
  hideOnForbidden = false
}: RoleGuardProps) {
  const { t } = useTranslation();
  const userRole = useUserRole();
  const isAdmin = useIsAdmin();

  // If user role is not loaded yet, don't render anything
  if (!userRole) {
    return null;
  }

  // Check if user has permission
  let hasPermission = false;

  if (adminOnly) {
    hasPermission = isAdmin;
  } else if (allowedRoles) {
    hasPermission = allowedRoles.includes(userRole);
  } else {
    // If no restrictions, allow all
    hasPermission = true;
  }

  if (!hasPermission) {
    if (hideOnForbidden) {
      return null;
    }

    if (fallback) {
      return <>{fallback}</>;
    }

    // Default forbidden message
    return (
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {t("common.accessDenied")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {adminOnly
              ? t("common.adminRequired")
              : t("common.insufficientPermissions")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}

// Utility components for specific roles
export function AdminOnly({ children, fallback, hideOnForbidden = false }: {
  children: ReactNode;
  fallback?: ReactNode;
  hideOnForbidden?: boolean;
}) {
  return (
    <RoleGuard adminOnly fallback={fallback} hideOnForbidden={hideOnForbidden}>
      {children}
    </RoleGuard>
  );
}

export function WorkerOnly({ children, fallback, hideOnForbidden = false }: {
  children: ReactNode;
  fallback?: ReactNode;
  hideOnForbidden?: boolean;
}) {
  return (
    <RoleGuard allowedRoles={['WORKER']} fallback={fallback} hideOnForbidden={hideOnForbidden}>
      {children}
    </RoleGuard>
  );
}

export function VetOnly({ children, fallback, hideOnForbidden = false }: {
  children: ReactNode;
  fallback?: ReactNode;
  hideOnForbidden?: boolean;
}) {
  return (
    <RoleGuard allowedRoles={['VET']} fallback={fallback} hideOnForbidden={hideOnForbidden}>
      {children}
    </RoleGuard>
  );
}

export function AdminOrWorker({ children, fallback, hideOnForbidden = false }: {
  children: ReactNode;
  fallback?: ReactNode;
  hideOnForbidden?: boolean;
}) {
  return (
    <RoleGuard allowedRoles={['ADMIN', 'WORKER']} fallback={fallback} hideOnForbidden={hideOnForbidden}>
      {children}
    </RoleGuard>
  );
}