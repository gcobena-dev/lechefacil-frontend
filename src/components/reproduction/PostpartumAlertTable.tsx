import { useTranslation } from "@/hooks/useTranslation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PostpartumAlert } from "@/services/reproductionDashboard";

export interface InseminationInfo {
  pregnancy_status: string;
  service_date: string;
}

interface Props {
  alerts: PostpartumAlert[];
  inseminationMap: Map<string, InseminationInfo>;
}

const LEVEL_STYLES: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  optimal: { variant: "default", label: "kpiOptimal" },
  warning: { variant: "secondary", label: "kpiWarning" },
  critical: { variant: "destructive", label: "kpiCritical" },
};

const REPRO_STATUS_VARIANTS: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  CONFIRMED: { variant: "default", label: "confirmed" },
  PENDING: { variant: "secondary", label: "pending" },
  OPEN: { variant: "outline", label: "open" },
  LOST: { variant: "destructive", label: "lost" },
};

export default function PostpartumAlertTable({ alerts, inseminationMap }: Props) {
  const { t } = useTranslation();

  const filteredAlerts = alerts.filter(
    (alert) => inseminationMap.get(alert.animal_id)?.pregnancy_status !== "CONFIRMED",
  );

  if (filteredAlerts.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        {t("reproduction.kpiNoPostpartumAlerts")}
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("reproduction.kpiAnimal")}</TableHead>
              <TableHead>{t("reproduction.kpiCalvingDate")}</TableHead>
              <TableHead className="text-right">
                {t("reproduction.kpiDaysPostpartum")}
              </TableHead>
              <TableHead>{t("reproduction.kpiAlertLevel")}</TableHead>
              <TableHead>{t("reproduction.kpiReproductiveStatus")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAlerts.map((alert) => {
              const style = LEVEL_STYLES[alert.alert_level] || LEVEL_STYLES.optimal;
              const insemination = inseminationMap.get(alert.animal_id);
              const reproStyle = insemination
                ? REPRO_STATUS_VARIANTS[insemination.pregnancy_status]
                : null;
              return (
                <TableRow key={alert.animal_id}>
                  <TableCell className="font-medium">
                    {alert.animal_tag}
                    {alert.animal_name ? ` - ${alert.animal_name}` : ""}
                  </TableCell>
                  <TableCell>
                    {new Date(alert.calving_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">{alert.days_postpartum}d</TableCell>
                  <TableCell>
                    <Badge variant={style.variant}>
                      {t(`reproduction.${style.label}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {reproStyle ? (
                      <Badge variant={reproStyle.variant}>
                        {t(`reproduction.${reproStyle.label}`)}
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        {t("reproduction.kpiNoInsemination")}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {filteredAlerts.map((alert) => {
          const style = LEVEL_STYLES[alert.alert_level] || LEVEL_STYLES.optimal;
          const insemination = inseminationMap.get(alert.animal_id);
          const reproStyle = insemination
            ? REPRO_STATUS_VARIANTS[insemination.pregnancy_status]
            : null;
          return (
            <Card key={alert.animal_id}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {alert.animal_tag}
                      {alert.animal_name ? ` - ${alert.animal_name}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(alert.calving_date).toLocaleDateString()} -{" "}
                      {alert.days_postpartum}d
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {reproStyle ? (
                      <Badge variant={reproStyle.variant}>
                        {t(`reproduction.${reproStyle.label}`)}
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        {t("reproduction.kpiNoInsemination")}
                      </Badge>
                    )}
                    <Badge variant={style.variant}>
                      {t(`reproduction.${style.label}`)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
