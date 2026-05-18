import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/useTranslation";
import { useIsAdmin } from "@/hooks/useAuth";
import { getInsemination } from "@/services/inseminations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PregnancyCheckDialog } from "@/components/reproduction/PregnancyCheckDialog";

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  CONFIRMED: "default",
  OPEN: "outline",
  LOST: "destructive",
};

function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString();
}

interface Props {
  inseminationId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function LastCheckResultDialog({ inseminationId, isOpen, onClose }: Props) {
  const { t } = useTranslation();
  const isAdmin = useIsAdmin();
  const [editOpen, setEditOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["inseminations", inseminationId],
    queryFn: () => getInsemination(inseminationId),
    enabled: isOpen,
  });

  return (
    <>
      <Dialog open={isOpen && !editOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("reproduction.lastCheckTitle")}</DialogTitle>
          </DialogHeader>

          {isLoading || !data ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              {t("reproduction.lastCheckLoading")}
            </p>
          ) : (
            <div className="space-y-3 text-sm">
              {/* Resultado + servicio */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">{t("reproduction.lastCheckResult")}</span>
                <Badge variant={STATUS_VARIANTS[data.pregnancy_status] ?? "secondary"}>
                  {t(`reproduction.${data.pregnancy_status.toLowerCase()}`)}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">
                  {t("reproduction.lastCheckServiceDate")}
                </span>
                <span>{formatDate(data.service_date)}</span>
              </div>

              {/* Datos del servicio */}
              <div className="pt-2 border-t space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{t("reproduction.lastCheckSire")}</span>
                  <span className="truncate text-right">{data.sire_name ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{t("reproduction.lastCheckMethod")}</span>
                  <span>{t(`reproduction.method${data.method}`)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{t("reproduction.lastCheckTechnician")}</span>
                  <span className="truncate text-right">{data.technician ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{t("reproduction.lastCheckStrawCount")}</span>
                  <span>{data.straw_count}</span>
                </div>
                {data.protocol && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">{t("reproduction.lastCheckProtocol")}</span>
                    <span className="truncate text-right">{data.protocol}</span>
                  </div>
                )}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{t("reproduction.lastCheckHeatDetected")}</span>
                  <span>
                    {data.heat_detected
                      ? t("reproduction.heatYes")
                      : t("reproduction.heatNo")}
                  </span>
                </div>
              </div>

              {/* Datos del chequeo (si existe) */}
              {(data.pregnancy_check_date ||
                data.pregnancy_checked_by ||
                data.expected_calving_date) && (
                <div className="pt-2 border-t space-y-3">
                  {data.pregnancy_check_date && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">
                        {t("reproduction.lastCheckDate")}
                      </span>
                      <span>{formatDate(data.pregnancy_check_date)}</span>
                    </div>
                  )}
                  {data.pregnancy_checked_by && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">
                        {t("reproduction.lastCheckBy")}
                      </span>
                      <span className="truncate text-right">{data.pregnancy_checked_by}</span>
                    </div>
                  )}
                  {data.expected_calving_date && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">
                        {t("reproduction.lastCheckExpectedCalving")}
                      </span>
                      <span>{formatDate(data.expected_calving_date)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Notas */}
              {data.notes && (
                <div className="pt-2 border-t">
                  <p className="text-muted-foreground text-xs mb-1">{t("reproduction.notes")}</p>
                  <p className="text-sm whitespace-pre-wrap">{data.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
              {t("reproduction.lastCheckClose")}
            </Button>
            {isAdmin && (
              <Button
                onClick={() => setEditOpen(true)}
                className="w-full sm:w-auto"
                disabled={!data}
              >
                {t("reproduction.lastCheckUpdateCheck")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {editOpen && (
        <PregnancyCheckDialog
          inseminationId={inseminationId}
          isOpen={editOpen}
          onClose={() => {
            setEditOpen(false);
            onClose();
          }}
        />
      )}
    </>
  );
}
