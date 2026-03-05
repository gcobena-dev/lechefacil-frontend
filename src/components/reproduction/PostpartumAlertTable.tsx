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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, AlertTriangle, Syringe } from "lucide-react";
import type { PostpartumAlert } from "@/services/reproductionDashboard";

export interface InseminationInfo {
  pregnancy_status: string;
  service_date: string;
}

interface Props {
  alerts: PostpartumAlert[];
  inseminationMap: Map<string, InseminationInfo>;
}

const LEVEL_STYLES: Record<
  string,
  { variant: "default" | "secondary" | "destructive" | "outline"; label: string; hint: string }
> = {
  optimal: { variant: "default", label: "kpiOptimal", hint: "kpiOptimalHint" },
  warning: { variant: "secondary", label: "kpiWarning", hint: "kpiWarningHint" },
  critical: { variant: "destructive", label: "kpiCritical", hint: "kpiCriticalHint" },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString();
}

function getReproStatus(
  insemination: InseminationInfo | undefined,
  t: (key: string) => string,
): { label: string; hint: string; variant: "default" | "secondary" | "destructive" | "outline"; serviceDate: string | null } {
  if (!insemination) {
    return {
      label: t("reproduction.kpiNoInsemination"),
      hint: t("reproduction.kpiNoInseminationHint"),
      variant: "destructive",
      serviceDate: null,
    };
  }

  const date = formatDate(insemination.service_date);

  switch (insemination.pregnancy_status) {
    case "PENDING":
      return {
        label: t("reproduction.kpiInseminatedPending"),
        hint: t("reproduction.kpiInseminatedPendingHint").replace("{date}", date),
        variant: "secondary",
        serviceDate: date,
      };
    case "OPEN":
      return {
        label: t("reproduction.kpiInseminatedOpen"),
        hint: t("reproduction.kpiInseminatedOpenHint").replace("{date}", date),
        variant: "outline",
        serviceDate: date,
      };
    case "LOST":
      return {
        label: t("reproduction.kpiInseminatedLost"),
        hint: t("reproduction.kpiInseminatedLostHint").replace("{date}", date),
        variant: "destructive",
        serviceDate: date,
      };
    default:
      return {
        label: t("reproduction.pending"),
        hint: "",
        variant: "secondary",
        serviceDate: date,
      };
  }
}

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
    <TooltipProvider>
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
              <TableHead>{t("reproduction.kpiPostpartumReproStatus")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAlerts.map((alert) => {
              const style = LEVEL_STYLES[alert.alert_level] || LEVEL_STYLES.optimal;
              const insemination = inseminationMap.get(alert.animal_id);
              const repro = getReproStatus(insemination, t);

              return (
                <TableRow key={alert.animal_id}>
                  <TableCell className="font-medium">
                    {alert.animal_tag}
                    {alert.animal_name ? ` - ${alert.animal_name}` : ""}
                  </TableCell>
                  <TableCell>
                    {formatDate(alert.calving_date)}
                  </TableCell>
                  <TableCell className="text-right">{alert.days_postpartum}d</TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center gap-1 cursor-help">
                          <Badge variant={style.variant}>
                            {t(`reproduction.${style.label}`)}
                          </Badge>
                          <Info className="h-3.5 w-3.5 text-muted-foreground" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[250px]">
                        <p className="text-xs">{t(`reproduction.${style.hint}`)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center gap-1 cursor-help">
                          <Badge variant={repro.variant}>
                            {repro.label}
                          </Badge>
                          <Info className="h-3.5 w-3.5 text-muted-foreground" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[280px]">
                        <p className="text-xs">{repro.hint}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3 overflow-hidden">
        {filteredAlerts.map((alert) => {
          const style = LEVEL_STYLES[alert.alert_level] || LEVEL_STYLES.optimal;
          const insemination = inseminationMap.get(alert.animal_id);
          const repro = getReproStatus(insemination, t);

          return (
            <Card key={alert.animal_id} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Header: animal name + alert badge */}
                <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
                  <p className="text-sm font-semibold truncate min-w-0">
                    {alert.animal_tag}
                    {alert.animal_name ? ` - ${alert.animal_name}` : ""}
                  </p>
                  <Badge variant={style.variant} className="shrink-0 text-[10px] px-1.5">
                    {t(`reproduction.${style.label}`)}
                  </Badge>
                </div>

                {/* Info rows */}
                <div className="px-3 pb-2 space-y-1.5">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="text-muted-foreground shrink-0">{t("reproduction.kpiCalvingDate")}</span>
                    <span className="truncate">{formatDate(alert.calving_date)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="text-muted-foreground shrink-0">{t("reproduction.kpiDaysPostpartum")}</span>
                    <span className="font-medium">{alert.days_postpartum}d</span>
                  </div>
                  {repro.serviceDate && (
                    <div className="flex items-center justify-between text-xs gap-2">
                      <span className="text-muted-foreground shrink-0">{t("reproduction.kpiLastService")}</span>
                      <span>{repro.serviceDate}</span>
                    </div>
                  )}
                </div>

                {/* Reproductive status footer */}
                <div className={`px-3 py-2 border-t ${
                  !insemination
                    ? "bg-destructive/10 border-destructive/20"
                    : insemination.pregnancy_status === "OPEN" || insemination.pregnancy_status === "LOST"
                      ? "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800"
                      : "bg-muted/50"
                }`}>
                  <div className="flex items-start gap-2 min-w-0">
                    {!insemination ? (
                      <AlertTriangle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                    ) : (
                      <Syringe className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    )}
                    <div className="min-w-0 overflow-hidden">
                      <p className="text-xs font-medium break-words">{repro.label}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight break-words">
                        {repro.hint}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
