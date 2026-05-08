import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listAccessRequests } from "@/services/accessRequests";
import type { AccessRequestStatus } from "@/services/types";

const TAB_LABELS: { value: AccessRequestStatus; label: string }[] = [
  { value: "pending", label: "Pendientes" },
  { value: "approved", label: "Aprobadas" },
  { value: "rejected", label: "Rechazadas" },
];

const statusVariant: Record<AccessRequestStatus, "default" | "secondary" | "destructive"> = {
  pending: "default",
  approved: "secondary",
  rejected: "destructive",
};

export default function AccessRequestsList() {
  const [tab, setTab] = useState<AccessRequestStatus>("pending");
  const { data, isLoading } = useQuery({
    queryKey: ["access-requests", tab],
    queryFn: () => listAccessRequests({ status: tab, limit: 100 }),
  });

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Solicitudes de acceso</h1>
        <p className="text-sm text-muted-foreground">
          Gestiona las solicitudes para crear nuevas fincas en LecheFácil.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as AccessRequestStatus)}>
        <TabsList>
          {TAB_LABELS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading && <div className="text-sm text-muted-foreground">Cargando…</div>}
      {!isLoading && data && data.items.length === 0 && (
        <div className="text-sm text-muted-foreground">Sin solicitudes en esta categoría.</div>
      )}

      <div className="grid gap-3">
        {data?.items.map((req) => (
          <Card key={req.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">
                  {req.full_name} — {req.farm_name}
                </CardTitle>
                <Badge variant={statusVariant[req.status]}>{req.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <div>
                <span className="text-muted-foreground">Email: </span>
                {req.email}
              </div>
              {req.farm_location && (
                <div>
                  <span className="text-muted-foreground">Ubicación: </span>
                  {req.farm_location}
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Rol solicitado: </span>
                {req.requested_role}
              </div>
              <div className="text-xs text-muted-foreground pt-2">
                Recibida {new Date(req.created_at).toLocaleString()}
              </div>
              <div className="pt-3">
                <Button asChild variant="outline" size="sm">
                  <Link to={`/admin/requests/${req.id}`}>Ver detalle</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
