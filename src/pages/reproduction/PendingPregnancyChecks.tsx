import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { usePendingPregnancyChecks } from "@/hooks/useReproduction";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ClipboardCheck } from "lucide-react";
import { PregnancyCheckDialog } from "@/components/reproduction/PregnancyCheckDialog";

export default function PendingPregnancyChecks() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: items, isLoading } = usePendingPregnancyChecks();
  const [checkDialogId, setCheckDialogId] = useState<string | null>(null);

  const pending = items ?? [];

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/reproduction")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">{t("reproduction.pendingPregnancyChecks")}</h1>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          {t("reproduction.loading")}
        </div>
      ) : pending.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ClipboardCheck className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>{t("reproduction.noPendingChecks")}</p>
          <p className="text-sm mt-1">{t("reproduction.allChecksUpToDate")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((ins) => {
            const daysSince = Math.floor(
              (Date.now() - new Date(ins.service_date).getTime()) / (1000 * 60 * 60 * 24)
            );
            return (
              <Card key={ins.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {ins.animal_tag || "-"}{ins.animal_name ? ` - ${ins.animal_name}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("reproduction.serviceDate")}:{" "}
                        {new Date(ins.service_date).toLocaleDateString()}
                        {" - "}
                        {t(`reproduction.method${ins.method}`)}
                      </p>
                      {ins.sire_name && (
                        <p className="text-xs text-muted-foreground">
                          {t("reproduction.sire")}: {ins.sire_name}
                        </p>
                      )}
                      {ins.technician && (
                        <p className="text-xs text-muted-foreground">
                          {t("reproduction.technician")}: {ins.technician}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="secondary">
                        {daysSince} {t("reproduction.daysSinceService").toLowerCase()}
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => setCheckDialogId(ins.id)}
                      >
                        {t("reproduction.recordCheck")}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {checkDialogId && (
        <PregnancyCheckDialog
          inseminationId={checkDialogId}
          isOpen={!!checkDialogId}
          onClose={() => setCheckDialogId(null)}
        />
      )}
    </div>
  );
}
