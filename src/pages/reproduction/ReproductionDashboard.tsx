import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/useTranslation";
import { useReproductionKPIs, useReproductiveAnimals } from "@/hooks/useReproductionDashboard";
import { useSires, useSemenStock } from "@/hooks/useReproduction";
import { myTenants } from "@/services/auth";
import { getTenantId } from "@/services/config";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Plus,
  ClipboardCheck,
  Package,
  Syringe,
  TrendingUp,
  Baby,
  BarChart3,
  Users,
  Calendar,
  FileText,
  ChevronDown,
} from "lucide-react";
import CompactPeriodSelector, {
  rangeForPeriod,
} from "@/components/reproduction/CompactPeriodSelector";
import CriticalAlertBanner from "@/components/reproduction/CriticalAlertBanner";
import KpiCard from "@/components/reproduction/KpiCard";
import ReproductiveStatusTabs from "@/components/reproduction/ReproductiveStatusTabs";
import ReproductiveAnimalsTable from "@/components/reproduction/ReproductiveAnimalsTable";
import {
  EMPTY_REPRO_FILTERS,
  type ReproFilterState,
} from "@/components/reproduction/ReproductiveAnimalsFilters";
import ReproductionShortcutCard from "@/components/reproduction/ReproductionShortcutCard";
import ReproductiveStatusChart from "@/components/charts/ReproductiveStatusChart";
import ServicesPerCowChart from "@/components/charts/ServicesPerCowChart";
import InseminationActivityChart from "@/components/charts/InseminationActivityChart";
import type { ReproductiveBucket } from "@/services/reproductionDashboard";

type PeriodKey = "3m" | "6m" | "12m" | "year";

export default function ReproductionDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [period, setPeriod] = useState<PeriodKey>("12m");
  const [dateFrom, dateTo] = useMemo(() => rangeForPeriod(period), [period]);
  const [bucket, setBucket] = useState<ReproductiveBucket>("alertas");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<ReproFilterState>(EMPTY_REPRO_FILTERS);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Filter state (string arrays) translated into the API query shape.
  const filterParams = useMemo(
    () => ({
      alert_level: filters.alert_level.length ? filters.alert_level : undefined,
      method: filters.method.length ? filters.method : undefined,
      pregnancy_status: filters.pregnancy_status.length
        ? filters.pregnancy_status
        : undefined,
      technician: filters.technician.length ? filters.technician : undefined,
      heat_detected:
        filters.heat_detected.length === 1
          ? filters.heat_detected[0] === "true"
          : undefined,
      last_event_type: filters.last_event_type.length
        ? filters.last_event_type
        : undefined,
      labels: filters.labels.length ? filters.labels : undefined,
    }),
    [filters],
  );

  // Tenant name (reuses cached query from Header)
  const { data: memberships } = useQuery({
    queryKey: ["my-tenants"],
    queryFn: myTenants,
  });
  const activeTenantId = getTenantId();
  const tenantName = memberships?.find((m) => m.tenant_id === activeTenantId)?.tenant_name ?? "";

  const { data: kpis } = useReproductionKPIs(dateFrom, dateTo);
  const { data: animalsData, isFetching: animalsLoading } = useReproductiveAnimals({
    filter: bucket,
    sort: "postpartum",
    sort_dir: "desc",
    search: search || undefined,
    ...filterParams,
    limit: pageSize,
    offset: page * pageSize,
  });
  const { data: siresData } = useSires({ active_only: true, limit: 100 });
  const { data: semenData } = useSemenStock({ in_stock_only: true, limit: 1 });

  const sireCount = siresData?.items.length ?? 0;
  const strawsCount = semenData?.total ?? 0;
  const breedsCount = semenData?.breeds_count ?? 0;
  const bucketCounts = animalsData?.bucket_counts ?? {
    alertas: 0,
    inseminadas: 0,
    prenadas: 0,
    vacias: 0,
    sin_inseminar: 0,
    todas: 0,
  };

  const warningCount = useMemo(
    () => kpis?.postpartum_alerts.filter((a) => a.alert_level === "warning").length ?? 0,
    [kpis],
  );

  const prev = kpis?.previous_period ?? null;

  return (
    <div className="space-y-6 min-w-0 max-w-full overflow-x-hidden">
      {/* 1. Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between min-w-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl md:text-3xl font-bold">{t("reproduction.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1 truncate">
            {t("reproduction.dashboardSubtitle")}
            {tenantName && ` · ${tenantName}`}
          </p>
        </div>
        <div className="flex flex-col gap-2 w-full md:w-auto md:flex-row md:items-center md:flex-wrap min-w-0">
          <div className="w-full md:w-auto">
            <CompactPeriodSelector value={period} onChange={setPeriod} />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 md:flex-none min-w-0"
              onClick={() => navigate("/reproduction/pregnancy-checks")}
            >
              <ClipboardCheck className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">{t("reproduction.pregnancyCheck")}</span>
            </Button>
            <Button
              size="sm"
              className="flex-1 md:flex-none min-w-0"
              onClick={() => navigate("/reproduction/inseminations/new")}
            >
              <Plus className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">{t("reproduction.newInsemination")}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Critical banner */}
      <CriticalAlertBanner
        criticalCount={bucketCounts.alertas}
        warningCount={warningCount}
        onReview={() => {
          setBucket("alertas");
          setPage(0);
          setFilters(EMPTY_REPRO_FILTERS);
        }}
      />

      {/* 3. KPIs with deltas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard
          icon={Syringe}
          iconClassName="text-pink-500"
          label={t("reproduction.kpiCowsInseminated")}
          value={kpis?.cows_inseminated ?? 0}
          delta={prev ? (kpis!.cows_inseminated - prev.cows_inseminated) : null}
          info={t("reproduction.kpiCowsInseminatedInfo")}
        />
        <KpiCard
          icon={Package}
          iconClassName="text-blue-500"
          label={t("reproduction.kpiStrawsUsed")}
          value={kpis?.straws_used ?? 0}
          delta={prev ? (kpis!.straws_used - prev.straws_used) : null}
          info={t("reproduction.kpiStrawsUsedInfo")}
        />
        <KpiCard
          icon={BarChart3}
          iconClassName="text-purple-500"
          label={t("reproduction.kpiServicesPerCow")}
          value={kpis?.services_per_cow ?? 0}
          delta={prev ? Number((kpis!.services_per_cow - prev.services_per_cow).toFixed(2)) : null}
          info={t("reproduction.kpiServicesPerCowInfo")}
        />
        <KpiCard
          icon={Baby}
          iconClassName="text-green-500"
          label={t("reproduction.kpiPregnantPct")}
          value={`${kpis?.pregnant_pct ?? 0}%`}
          delta={prev ? Number((kpis!.pregnant_pct - prev.pregnant_pct).toFixed(1)) : null}
          unit="pp"
          info={t("reproduction.kpiPregnantPctInfo")}
        />
        <KpiCard
          icon={TrendingUp}
          iconClassName="text-emerald-500"
          label={t("reproduction.kpiConceptionRate")}
          value={`${kpis?.conception_rate ?? 0}%`}
          delta={prev ? Number((kpis!.conception_rate - prev.conception_rate).toFixed(1)) : null}
          unit="pp"
          info={t("reproduction.kpiConceptionRateInfo")}
        />
      </div>

      {/* 4. Tabs + Unified Table */}
      <div className="space-y-3">
        <ReproductiveStatusTabs
          active={bucket}
          counts={bucketCounts}
          onChange={(b) => {
            setBucket(b);
            setPage(0);
            // Filters are tab-specific; reset them when switching tabs.
            setFilters(EMPTY_REPRO_FILTERS);
          }}
        />
        <ReproductiveAnimalsTable
          items={animalsData?.items ?? []}
          bucket={bucket}
          total={animalsData?.total ?? 0}
          isLoading={animalsLoading}
          search={search}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(0);
          }}
          filters={filters}
          onFiltersChange={(f) => {
            setFilters(f);
            setPage(0);
          }}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* 5. Shortcut cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <ReproductionShortcutCard
          icon={Users}
          title={t("reproduction.shortcutSireCatalog")}
          subtitle={t("reproduction.shortcutSireCatalogSubtitle").replace(
            "{count}",
            String(sireCount),
          )}
          onClick={() => navigate("/reproduction/sires")}
        />
        <ReproductionShortcutCard
          icon={Package}
          title={t("reproduction.shortcutSemenInventory")}
          subtitle={t("reproduction.shortcutSemenInventorySubtitle")
            .replace("{straws}", String(strawsCount))
            .replace("{breeds}", String(breedsCount))}
          onClick={() => navigate("/reproduction/semen")}
        />
        <ReproductionShortcutCard
          icon={Calendar}
          title={t("reproduction.shortcutCalendar")}
          subtitle={t("reproduction.shortcutCalendarSubtitle")}
          disabled
        />
        <ReproductionShortcutCard
          icon={FileText}
          title={t("reproduction.shortcutReport")}
          subtitle={t("reproduction.shortcutReportSubtitle")}
          disabled
        />
      </div>

      {/* 6. Analysis accordion */}
      {kpis && (
        <Accordion type="single" collapsible defaultValue="analysis">
          <AccordionItem value="analysis" className="border-none">
            <AccordionTrigger className="hover:no-underline rounded-md border bg-card px-4 py-3 [&>svg]:hidden">
              <div className="flex items-center gap-2 flex-1">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span className="text-base font-semibold">
                  {t("reproduction.analysisSection")}
                </span>
                <span className="text-xs text-muted-foreground ml-1">
                  · {t("reproduction.chartsCount").replace("{n}", "3")}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 [&[data-state=open]]:rotate-180" />
            </AccordionTrigger>
            <AccordionContent className="pt-3">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-xs text-muted-foreground mb-3 uppercase">
                      {t("reproduction.kpiReproductiveStatus")}
                    </p>
                    <ReproductiveStatusChart data={kpis.status_breakdown} />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-xs text-muted-foreground mb-3 uppercase">
                      {t("reproduction.kpiServicesDistribution")}
                    </p>
                    <ServicesPerCowChart data={kpis.services_distribution} />
                  </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                  <CardContent className="pt-6">
                    <p className="text-xs text-muted-foreground mb-3 uppercase">
                      {t("reproduction.kpiInseminationActivity")}
                    </p>
                    <InseminationActivityChart
                      data={kpis.monthly_activity}
                      trends={kpis.monthly_trends}
                    />
                  </CardContent>
                </Card>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}
