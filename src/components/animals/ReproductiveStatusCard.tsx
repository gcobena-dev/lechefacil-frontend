import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { HeartPulse, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { listInseminations } from "@/services/inseminations";
import type { Lactation } from "@/services/lactations";
import { formatDateOnly } from "@/utils/format";
import { getLocalDateString, toDate } from "@/utils/dateUtils";

const PREGNANT_STATUS_CODES = ["PREGNANT_DRY", "PREGNANT_HEIFER"];

function daysBetween(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

interface ReproductiveStatusCardProps {
  animalId: string;
  statusCode?: string | null;
  lactations: Lactation[];
}

/**
 * Where a breeding female stands: pregnant, served and waiting for the check,
 * or open; plus her current lactation. A service done before her last calving
 * belongs to a finished cycle and is ignored, as in the reproduction module.
 */
export default function ReproductiveStatusCard({ animalId, statusCode, lactations }: ReproductiveStatusCardProps) {
  const { t } = useTranslation();
  const { data } = useQuery({
    queryKey: ["inseminations", { animal_id: animalId, limit: 1 }],
    queryFn: () =>
      listInseminations({ animal_id: animalId, limit: 1, sort_by: "service_date", sort_dir: "desc" }),
  });

  const today = new Date();
  const openLactation = lactations.find((l) => !l.end_date);
  const lastCalving = lactations.reduce<string | null>(
    (latest, l) => (latest && latest > l.start_date ? latest : l.start_date),
    null
  );

  const latest = data?.items?.[0];
  const service =
    latest && lastCalving && getLocalDateString(toDate(latest.service_date)) < lastCalving ? undefined : latest;

  const pregnant =
    service?.pregnancy_status === "CONFIRMED" || PREGNANT_STATUS_CODES.includes(statusCode ?? "");

  let situation: { label: string; variant: "default" | "secondary" | "outline" | "destructive" };
  if (pregnant) situation = { label: t("animals.repro.pregnant"), variant: "default" };
  else if (service?.pregnancy_status === "PENDING") situation = { label: t("animals.repro.served"), variant: "secondary" };
  else if (service) situation = { label: t("animals.repro.open"), variant: "outline" };
  else situation = { label: t("animals.repro.notServed"), variant: "outline" };

  const expected = pregnant && service?.expected_calving_date ? toDate(service.expected_calving_date) : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2">
          <HeartPulse className="h-5 w-5" />
          {t("animals.repro.title")}
        </CardTitle>
        <Button variant="outline" size="sm" asChild>
          <Link to={`/reproduction/inseminations/new?animal_id=${animalId}`}>
            <Plus className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">{t("animals.repro.registerService")}</span>
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{t("animals.repro.situation")}</p>
            <Badge variant={situation.variant}>{situation.label}</Badge>
          </div>

          {service && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{t("animals.repro.lastService")}</p>
              <p>{formatDateOnly(service.service_date)}</p>
              {service.sire_name && (
                <p className="text-sm">
                  {service.sire_catalog_id ? (
                    <Link to={`/reproduction/sires/${service.sire_catalog_id}`} className="text-primary hover:underline">
                      {service.sire_name}
                    </Link>
                  ) : (
                    service.sire_name
                  )}
                </p>
              )}
            </div>
          )}

          {expected && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{t("animals.repro.expectedCalving")}</p>
              <p>{formatDateOnly(service!.expected_calving_date)}</p>
              <p className="text-sm text-muted-foreground">
                {t("animals.repro.gestationDays").replace("{days}", String(daysBetween(toDate(service!.service_date), today)))}
                {" · "}
                {daysBetween(today, expected) >= 0
                  ? t("animals.repro.inDays").replace("{days}", String(daysBetween(today, expected)))
                  : t("animals.repro.overdue")}
              </p>
            </div>
          )}

          {openLactation ? (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{t("animals.repro.currentLactation")}</p>
              <p>#{openLactation.number}</p>
              <p className="text-sm text-muted-foreground">
                {t("animals.repro.daysInMilk").replace("{days}", String(daysBetween(toDate(openLactation.start_date), today)))}
              </p>
            </div>
          ) : (
            lastCalving && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{t("animals.repro.lastCalving")}</p>
                <p>{formatDateOnly(lastCalving)}</p>
              </div>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}
