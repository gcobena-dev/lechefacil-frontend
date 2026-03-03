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

interface Props {
  alerts: PostpartumAlert[];
}

const LEVEL_STYLES: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  optimal: { variant: "default", label: "kpiOptimal" },
  warning: { variant: "secondary", label: "kpiWarning" },
  critical: { variant: "destructive", label: "kpiCritical" },
};

export default function PostpartumAlertTable({ alerts }: Props) {
  const { t } = useTranslation();

  if (alerts.length === 0) {
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {alerts.map((alert) => {
              const style = LEVEL_STYLES[alert.alert_level] || LEVEL_STYLES.optimal;
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
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {alerts.map((alert) => {
          const style = LEVEL_STYLES[alert.alert_level] || LEVEL_STYLES.optimal;
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
                  <Badge variant={style.variant}>
                    {t(`reproduction.${style.label}`)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
