import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Edit } from "lucide-react";
import type { HealthRecordResponse } from "@/services/healthRecords";
import { useTranslation } from "@/hooks/useTranslation";

interface HealthEventCardProps {
  event: HealthRecordResponse;
  animalId: string;
  expanded?: boolean;
  onExpandToggle?: () => void;
}

export default function HealthEventCard({
  event,
  animalId,
  expanded = false,
  onExpandToggle,
}: HealthEventCardProps) {
  const { t } = useTranslation();

  const getEventIcon = (type: string) => {
    const icons = {
      VACCINATION: "💉",
      TREATMENT: "💊",
      VET_OBSERVATION: "🩺",
      EMERGENCY: "🚑",
    };
    return icons[type as keyof typeof icons] || "📋";
  };

  const getEventLabel = (type: string) => {
    const labels = {
      VACCINATION: t("health.vaccination"),
      TREATMENT: t("health.treatment"),
      VET_OBSERVATION: t("health.vetObservation"),
      EMERGENCY: t("health.emergency"),
    };
    return labels[type as keyof typeof labels] || type;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <Card>
      <CardContent className="p-4">
        {/* Resumen compacto */}
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-lg">{getEventIcon(event.event_type)}</span>
              <span className="text-sm text-muted-foreground">
                {formatDate(event.occurred_at)}
              </span>
              {event.withdrawal_days && (
                <Badge variant="destructive" className="ml-2">
                  ⚠️ {t("health.withdrawal")}: {event.withdrawal_days} {t("health.days")}
                </Badge>
              )}
            </div>
            <h4 className="font-semibold">
              {event.vaccine_name || event.medication || getEventLabel(event.event_type)}
            </h4>
            <p className="text-sm text-muted-foreground">
              {event.veterinarian && `${event.veterinarian}`}
              {event.veterinarian && event.cost && " | "}
              {event.cost && formatCurrency(event.cost)}
            </p>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/animals/${animalId}/health/${event.id}/edit`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onExpandToggle}
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Detalles expandidos */}
        {expanded && (
          <div className="mt-4 pt-4 border-t space-y-3">
            {event.vaccine_name && (
              <div>
                <p className="text-sm font-medium">{t("health.vaccine")}</p>
                <p className="text-sm text-muted-foreground">
                  {event.vaccine_name}
                </p>
                {event.next_dose_date && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("health.nextDose")}: {formatDate(event.next_dose_date)}
                  </p>
                )}
              </div>
            )}

            {event.medication && (
              <>
                <div>
                  <p className="text-sm font-medium">{t("health.medication")}</p>
                  <p className="text-sm text-muted-foreground">
                    {event.medication}
                  </p>
                </div>
                {event.duration_days && (
                  <div>
                    <p className="text-sm font-medium">{t("health.duration")}</p>
                    <p className="text-sm text-muted-foreground">
                      {event.duration_days} {t("health.days")}
                    </p>
                  </div>
                )}
                {event.withdrawal_until && (
                  <div>
                    <p className="text-sm font-medium text-yellow-700">
                      {t("health.withdrawalPeriodLabel")}
                    </p>
                    <p className="text-sm text-yellow-700">
                      {t("health.doNotMilkUntilLabel")}: {formatDate(event.withdrawal_until)}
                    </p>
                  </div>
                )}
              </>
            )}

            {event.notes && (
              <div>
                <p className="text-sm font-medium">{t("health.notes")}</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {event.notes}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
