import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  approveAccessRequest,
  getAccessRequest,
  rejectAccessRequest,
} from "@/services/accessRequests";
import type { AccessRequestStatus } from "@/services/types";

const statusVariant: Record<AccessRequestStatus, "default" | "secondary" | "destructive"> = {
  pending: "default",
  approved: "secondary",
  rejected: "destructive",
};

export default function AccessRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");

  const { data: req, isLoading } = useQuery({
    queryKey: ["access-request", id],
    queryFn: () => getAccessRequest(id!),
    enabled: !!id,
  });

  const { mutateAsync: doApprove, isPending: isApproving } = useMutation({
    mutationFn: () => approveAccessRequest(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["access-request", id] });
      queryClient.invalidateQueries({ queryKey: ["access-requests"] });
      toast({
        title: "Solicitud aprobada",
        description: "Se creó la finca y se envió correo al solicitante.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo aprobar la solicitud.",
        variant: "destructive",
      });
    },
  });

  const { mutateAsync: doReject, isPending: isRejecting } = useMutation({
    mutationFn: (notes?: string) => rejectAccessRequest(id!, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["access-request", id] });
      queryClient.invalidateQueries({ queryKey: ["access-requests"] });
      setRejectOpen(false);
      setRejectNotes("");
      toast({
        title: "Solicitud rechazada",
        description: "Se notificó al solicitante.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo rechazar la solicitud.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Cargando…</div>;
  }
  if (!req) {
    return <div className="p-6 text-sm text-muted-foreground">No se encontró la solicitud.</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate("/admin/requests")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Volver
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{req.full_name}</CardTitle>
              <p className="text-sm text-muted-foreground">{req.email}</p>
            </div>
            <Badge variant={statusVariant[req.status]}>{req.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="text-muted-foreground text-xs">Teléfono</div>
              <div>{req.phone_number || "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Rol solicitado</div>
              <div>{req.requested_role}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Nombre de la finca</div>
              <div>{req.farm_name}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Ubicación</div>
              <div>{req.farm_location || "—"}</div>
            </div>
          </div>
          {req.message && (
            <div>
              <div className="text-muted-foreground text-xs">Mensaje</div>
              <div className="whitespace-pre-wrap">{req.message}</div>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            Recibida {new Date(req.created_at).toLocaleString()}
          </div>

          {req.status !== "pending" && (
            <div className="border-t pt-3 space-y-1">
              <div className="text-xs text-muted-foreground">
                Decidida {req.decided_at && new Date(req.decided_at).toLocaleString()}
              </div>
              {req.decision_notes && (
                <div className="text-sm whitespace-pre-wrap bg-muted p-2 rounded">
                  {req.decision_notes}
                </div>
              )}
              {req.created_tenant_id && (
                <div className="text-xs text-muted-foreground">
                  Finca creada: <code>{req.created_tenant_id}</code>
                </div>
              )}
            </div>
          )}

          {req.status === "pending" && (
            <div className="flex gap-2 pt-3 border-t">
              <Button
                onClick={() => doApprove()}
                disabled={isApproving || isRejecting}
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-1" />
                {isApproving ? "Aprobando…" : "Aprobar"}
              </Button>
              <Button
                variant="destructive"
                onClick={() => setRejectOpen(true)}
                disabled={isApproving || isRejecting}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-1" />
                Rechazar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar solicitud</DialogTitle>
            <DialogDescription>
              Se notificará al solicitante con un correo. Puedes incluir un comentario opcional.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rejectNotes">Comentario (opcional)</Label>
            <Textarea
              id="rejectNotes"
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              rows={4}
              placeholder="Ej. Faltan datos de contacto verificables…"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={isRejecting}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => doReject(rejectNotes.trim() || undefined)}
              disabled={isRejecting}
            >
              {isRejecting ? "Rechazando…" : "Confirmar rechazo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
