import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/useTranslation";

interface HealthSummaryCardsProps {
  inWithdrawal: boolean;
  withdrawalUntil?: string | null;
}

export default function HealthSummaryCards({
  inWithdrawal,
  withdrawalUntil,
}: HealthSummaryCardsProps) {
  const { t } = useTranslation();

  const getHealthStatus = () => {
    if (inWithdrawal) {
      return {
        icon: "🟡",
        label: t("health.inWithdrawal"),
        color: "bg-warning/15 text-warning border-warning/25",
      };
    }
    return {
      icon: "🟢",
      label: t("health.healthy"),
      color: "bg-success/10 text-success border-success/20",
    };
  };

  const status = getHealthStatus();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 mb-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{status.icon}</span>
            <div>
              <p className="text-sm text-muted-foreground">{t("health.healthStatus")}</p>
              <Badge className={status.color}>{status.label}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div>
            <p className="text-sm text-muted-foreground">{t("health.withdrawalPeriod")}</p>
            {inWithdrawal && withdrawalUntil ? (
              <div className="mt-1">
                <p className="font-medium text-warning">
                  {t("health.until")}: {formatDate(withdrawalUntil)}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground mt-1">{t("health.noActiveWithdrawal")}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
