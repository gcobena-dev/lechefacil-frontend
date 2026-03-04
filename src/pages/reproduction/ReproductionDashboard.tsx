import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/useTranslation";
import { useInseminations, usePendingPregnancyChecks } from "@/hooks/useReproduction";
import { useReproductionKPIs } from "@/hooks/useReproductionDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Heart,
  Plus,
  AlertCircle,
  ClipboardCheck,
  Package,
  Syringe,
  Users,
  TrendingUp,
  Baby,
  XCircle,
  HelpCircle,
  BarChart3,
} from "lucide-react";
import DateRangeFilter from "@/components/reproduction/DateRangeFilter";
import ReproductiveStatusChart from "@/components/charts/ReproductiveStatusChart";
import ServicesPerCowChart from "@/components/charts/ServicesPerCowChart";
import InseminationActivityChart from "@/components/charts/InseminationActivityChart";
import MonthlyTrendChart from "@/components/charts/MonthlyTrendChart";
import PostpartumAlertTable from "@/components/reproduction/PostpartumAlertTable";
import type { InseminationInfo } from "@/components/reproduction/PostpartumAlertTable";
import { listInseminations } from "@/services/inseminations";

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  CONFIRMED: "default",
  OPEN: "outline",
  LOST: "destructive",
};

function formatDefaultDateFrom(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().split("T")[0];
}

function formatToday(): string {
  return new Date().toISOString().split("T")[0];
}

export default function ReproductionDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [dateFrom, setDateFrom] = useState(formatDefaultDateFrom);
  const [dateTo, setDateTo] = useState(formatToday);

  const { data: kpis, isLoading: kpisLoading } = useReproductionKPIs(dateFrom, dateTo);
  const { data: inseminationsData } = useInseminations({ limit: 5 });
  const { data: pendingChecks } = usePendingPregnancyChecks();

  const postpartumAnimalIds = useMemo(
    () => kpis?.postpartum_alerts.map((a) => a.animal_id) ?? [],
    [kpis?.postpartum_alerts],
  );

  const inseminationQueries = useQuery({
    queryKey: ["inseminations-postpartum", postpartumAnimalIds],
    queryFn: () =>
      Promise.all(
        postpartumAnimalIds.map((id) =>
          listInseminations({ animal_id: id, limit: 1, sort_by: "service_date", sort_dir: "desc" }),
        ),
      ),
    enabled: postpartumAnimalIds.length > 0,
  });

  const inseminationMap = useMemo(() => {
    const map = new Map<string, InseminationInfo>();
    if (!inseminationQueries.data) return map;
    inseminationQueries.data.forEach((res, i) => {
      const item = res.items[0];
      if (item) {
        map.set(postpartumAnimalIds[i], {
          pregnancy_status: item.pregnancy_status,
          service_date: item.service_date,
        });
      }
    });
    return map;
  }, [inseminationQueries.data, postpartumAnimalIds]);

  const pendingCount = pendingChecks?.length ?? 0;
  const recentInseminations = inseminationsData?.items ?? [];

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* 1. Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Heart className="h-6 w-6" />
          {t("reproduction.dashboard")}
        </h1>
        <Button className="w-full md:w-auto" onClick={() => navigate("/reproduction/inseminations/new")}>
          <Plus className="mr-2 h-4 w-4" />
          {t("reproduction.newInsemination")}
        </Button>
      </div>

      {/* 2. Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-auto py-2 flex-col gap-1"
          onClick={() => navigate("/reproduction/inseminations/new")}
        >
          <Plus className="h-4 w-4" />
          <span className="text-[10px] leading-tight text-center">{t("reproduction.recordInsemination")}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-auto py-2 flex-col gap-1"
          onClick={() => navigate("/reproduction/pregnancy-checks")}
        >
          <ClipboardCheck className="h-4 w-4" />
          <span className="text-[10px] leading-tight text-center">{t("reproduction.pregnancyChecks")}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-auto py-2 flex-col gap-1"
          onClick={() => navigate("/reproduction/sires")}
        >
          <Heart className="h-4 w-4" />
          <span className="text-[10px] leading-tight text-center">{t("reproduction.sireCatalog")}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-auto py-2 flex-col gap-1"
          onClick={() => navigate("/reproduction/semen")}
        >
          <Package className="h-4 w-4" />
          <span className="text-[10px] leading-tight text-center">{t("reproduction.semenInventory")}</span>
        </Button>
      </div>

      {/* 3. Date Range Filter */}
      <hr className="border-border" />
      <DateRangeFilter
        dateFrom={dateFrom}
        dateTo={dateTo}
        onChange={(f, to) => { setDateFrom(f); setDateTo(to); }}
      />

      {/* 4. KPI Cards */}
      {kpisLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-3">
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : kpis ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Syringe className="h-4 w-4 text-pink-500" />
                <span className="text-[11px] text-muted-foreground">{t("reproduction.kpiCowsInseminated")}</span>
              </div>
              <p className="text-2xl font-bold">{kpis.cows_inseminated}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Package className="h-4 w-4 text-blue-500" />
                <span className="text-[11px] text-muted-foreground">{t("reproduction.kpiStrawsUsed")}</span>
              </div>
              <p className="text-2xl font-bold">{kpis.straws_used}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <BarChart3 className="h-4 w-4 text-purple-500" />
                <span className="text-[11px] text-muted-foreground">{t("reproduction.kpiServicesPerCow")}</span>
              </div>
              <p className="text-2xl font-bold">{kpis.services_per_cow}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Baby className="h-4 w-4 text-green-500" />
                <span className="text-[11px] text-muted-foreground">{t("reproduction.kpiPregnantPct")}</span>
              </div>
              <p className="text-2xl font-bold">{kpis.pregnant_pct}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-[11px] text-muted-foreground">{t("reproduction.kpiOpenPct")}</span>
              </div>
              <p className="text-2xl font-bold">{kpis.open_pct}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span className="text-[11px] text-muted-foreground">{t("reproduction.kpiConceptionRate")}</span>
              </div>
              <p className="text-2xl font-bold">{kpis.conception_rate}%</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* 5. Chart Row 1: Donut + Bar */}
      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("reproduction.kpiReproductiveStatus")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ReproductiveStatusChart data={kpis.status_breakdown} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("reproduction.kpiServicesDistribution")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ServicesPerCowChart data={kpis.services_distribution} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* 6. Chart Row 2: Activity + Trends */}
      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("reproduction.kpiInseminationActivity")}</CardTitle>
            </CardHeader>
            <CardContent>
              <InseminationActivityChart data={kpis.monthly_activity} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("reproduction.kpiMonthlyTrends")}</CardTitle>
            </CardHeader>
            <CardContent>
              <MonthlyTrendChart data={kpis.monthly_trends} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* 7. Postpartum Alert Table */}
      {kpis && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              {t("reproduction.kpiPostpartumAlerts")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PostpartumAlertTable alerts={kpis.postpartum_alerts} inseminationMap={inseminationMap} />
          </CardContent>
        </Card>
      )}

      {/* 8. Pending Checks Alert */}
      {pendingCount > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-orange-700 dark:text-orange-400">
              <AlertCircle className="h-5 w-5" />
              {t("reproduction.pendingPregnancyChecks")} ({pendingCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/reproduction/pregnancy-checks")}
            >
              {t("reproduction.viewAll")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 9. Recent Inseminations */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {t("reproduction.recentInseminations")}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/reproduction/inseminations")}
            >
              {t("reproduction.viewAll")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentInseminations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Heart className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>{t("reproduction.noInseminations")}</p>
              <p className="text-sm mt-1">
                {t("reproduction.startByRecording")}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentInseminations.map((ins) => (
                <div
                  key={ins.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {ins.animal_tag || "-"}{ins.animal_name ? ` - ${ins.animal_name}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(ins.service_date).toLocaleDateString()} -{" "}
                      {t(`reproduction.method${ins.method}`)}
                    </p>
                    {ins.sire_name && (
                      <p className="text-xs text-muted-foreground">
                        {t("reproduction.sire")}: {ins.sire_name}
                      </p>
                    )}
                  </div>
                  <Badge variant={STATUS_VARIANTS[ins.pregnancy_status] || "secondary"}>
                    {t(`reproduction.${ins.pregnancy_status.toLowerCase()}`)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
