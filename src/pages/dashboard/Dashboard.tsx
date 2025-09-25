import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Milk,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  AlertTriangle,
  Plus,
  RefreshCw
} from "lucide-react";
import { formatCurrency } from "@/lib/mock-data";
import { RoleBasedSections } from "@/components/dashboard/RoleBasedSections";
import { Link } from "react-router-dom";
import { useDashboardData } from "@/hooks/useDashboard";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserRole, useUserId } from "@/hooks/useAuth";

// -----------------------------
// Helpers seguros reutilizables
// -----------------------------
const toNum = (v: unknown, fallback = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const toStr = (v: unknown, fallback = ""): string => {
  if (typeof v === "string") return v;
  if (v == null) return fallback;
  try {
    return String(v);
  } catch {
    return fallback;
  }
};

const clamp = (n: number, min = 0, max = 100) => Math.min(max, Math.max(min, n));

export default function Dashboard() {
  const { t } = useTranslation();
  const userRole = useUserRole() || 'ADMIN'; // Default to ADMIN if not loaded yet
  const userId = useUserId();

  // Get dashboard data based on user role
  const {
    dailyKPIs,
    topProducers,
    dailyProgress,
    alerts,
    workerProgress,
    vetAlerts,
    adminOverview,
    isLoading,
    hasError,
    errors
  } = useDashboardData(userRole);

  const today = new Date();

  // -----------------------------
  // Derivados con casting/guardas
  // -----------------------------
  const totalLiters = toNum(dailyKPIs.data?.total_liters);
  const totalLitersFixed = totalLiters.toFixed(2);

  const totalRevenue = toNum(dailyKPIs.data?.total_revenue);

  const avgPerAnimal = toNum(dailyKPIs.data?.average_per_animal);
  const avgPerAnimalFixed = avgPerAnimal.toFixed(1);

  const activeAnimals = toNum(dailyKPIs.data?.active_animals_count);

  // Trends como string seguro
  const litersVsYesterday = toStr(dailyKPIs.data?.trends?.liters_vs_yesterday, "0%").trim();
  const litersTrendUp = litersVsYesterday.startsWith("+");

  const revenueVsYesterday = toStr(dailyKPIs.data?.trends?.revenue_vs_yesterday, "0%").trim();
  const revenueTrendUp = revenueVsYesterday.startsWith("+");

  const averageVsYesterday = toStr(dailyKPIs.data?.trends?.average_vs_yesterday, "0%").trim();
  const averageTrendUp = averageVsYesterday.startsWith("+");

  // Daily progress seguro
  const morningStatus = dailyProgress.data?.shifts?.morning?.status ?? "pending";
  const eveningStatus = dailyProgress.data?.shifts?.evening?.status ?? "pending";

  const eveningTime = dailyProgress.data?.shifts?.evening?.scheduled_at
    ? new Date(dailyProgress.data.shifts.evening.scheduled_at).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })
    : "";

  const completionPct = clamp(toNum(dailyProgress.data?.daily_goal?.completion_percentage), 0, 100);
  const dailyGoalTarget = toNum(dailyProgress.data?.daily_goal?.target_liters);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{t("dashboard.loading")}</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">{t("dashboard.error")}</h2>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t("dashboard.retry")}
          </Button>
        </div>
      </div>
    );
  }

  const topList = topProducers.data?.top_producers ?? [];
  const alertsList = alerts.data?.alerts ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t("dashboard.title")}</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            {t("dashboard.subtitle")} {today.toLocaleDateString('es-EC', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
        {/* Quick Action Button - Always visible */}
        <Button asChild className="shadow-lg w-full sm:w-auto">
          <Link to="/milk/collect">
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">{t("dashboard.registerMilking")}</span>
            <span className="sm:hidden">{t("dashboard.milking")}</span>
          </Link>
        </Button>
      </div>

      {/* Role-based sections */}
      <div className="grid gap-6 xl:grid-cols-4">
        <div className="xl:col-span-3 space-y-6">

          {/* KPI Cards */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("dashboard.litersToday")}</CardTitle>
                <Milk className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalLitersFixed}{t("dashboard.liters")}</div>
                <p className="text-xs text-muted-foreground">
                  <span className={`flex items-center gap-1 ${
                    litersTrendUp ? 'text-success' : 'text-destructive'
                  }`}>
                    {litersTrendUp ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {litersVsYesterday} {t("dashboard.vsYesterday")}
                  </span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("dashboard.revenueToday")}</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  <span className={`flex items-center gap-1 ${
                    revenueTrendUp ? 'text-success' : 'text-destructive'
                  }`}>
                    {revenueTrendUp ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {revenueVsYesterday} {t("dashboard.vsYesterday")}
                  </span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("dashboard.averagePerAnimal")}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgPerAnimalFixed}{t("dashboard.liters")}</div>
                <p className="text-xs text-muted-foreground">
                  <span className={`flex items-center gap-1 ${
                    averageTrendUp ? 'text-success' : 'text-destructive'
                  }`}>
                    {averageTrendUp ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {averageVsYesterday} {t("dashboard.vsYesterday")}
                  </span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("dashboard.activeAnimals")}</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeAnimals}</div>
                <p className="text-xs text-muted-foreground">
                  {t("dashboard.totalInProduction")}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top 5 Animals */}
            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.topProducersToday")}</CardTitle>
                <CardDescription>{t("dashboard.topProducersDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topList.length > 0 ? (
                    topList.map((animal: any, index: number) => {
                      const name = toStr(animal?.name, "-");
                      const tag = toStr(animal?.tag, "");
                      const liters = toNum(animal?.today_liters);
                      const trend = toStr(animal?.trend, "");
                      const trendPct = toStr(animal?.trend_percentage, "");
                      return (
                        <div key={toStr(animal?.animal_id, `${index}`)} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{name}</p>
                              <p className="text-sm text-muted-foreground">{tag}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{liters}{t("dashboard.liters")}</span>
                            {trend === 'up' ? (
                              <TrendingUp className="h-4 w-4 text-success" />
                            ) : trend === 'down' ? (
                              <TrendingDown className="h-4 w-4 text-warning" />
                            ) : null}
                            <span className="text-xs text-muted-foreground">{trendPct}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-muted-foreground text-center py-4">{t("dashboard.noData")}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Alerts and Notifications */}
            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.alertsTitle")}</CardTitle>
                <CardDescription>{t("dashboard.alertsDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alertsList.length > 0 ? (
                    alertsList.map((alert: any) => (
                      <div key={toStr(alert?.id)} className="flex items-start gap-3 p-3 rounded-lg border">
                        <AlertTriangle className={`h-4 w-4 mt-0.5 ${
                          alert?.priority === 'high' ? 'text-destructive' :
                          alert?.priority === 'medium' ? 'text-warning' : 'text-muted-foreground'
                        }`} />
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">{toStr(alert?.message, "-")}</p>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                alert?.priority === 'high' ? 'destructive' :
                                alert?.priority === 'medium' ? 'secondary' : 'outline'
                              }
                              className="text-xs"
                            >
                              {alert?.type === 'health' ? t("dashboard.health") :
                               alert?.type === 'production' ? t("dashboard.production") : t("dashboard.price")}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {alert?.created_at ? new Date(alert.created_at).toLocaleDateString('es-EC') : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">{t("dashboard.noData")}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Role-based sidebar */}
        <div>
          <RoleBasedSections userRole={userRole} userId={userId} />
        </div>
      </div>

      {/* Production Progress */}
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.dailyProgressTitle")}</CardTitle>
          <CardDescription>{t("dashboard.dailyProgressDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {dailyProgress.data ? (
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>{t("dashboard.morningMilking")}</span>
                <span className={`font-medium ${
                  morningStatus === 'completed' ? 'text-success' :
                  morningStatus === 'in_progress' ? 'text-warning' : 'text-muted-foreground'
                }`}>
                  {morningStatus === 'completed' ? t("dashboard.completed") :
                   morningStatus === 'in_progress' ? t("dashboard.inProgress") : t("dashboard.pending")}
                </span>
              </div>
              <Progress value={morningStatus === 'completed' ? 100 : 0} className="h-2" />

              <div className="flex justify-between text-sm">
                <span>{t("dashboard.dailyGoal")} ({dailyGoalTarget}{t("dashboard.liters")})</span>
                <span className="font-medium">{completionPct.toFixed(0)}{t("dashboard.percentage")}</span>
              </div>
              <Progress value={completionPct} className="h-2" />

              <div className="flex justify-between text-sm">
                <span>{t("dashboard.eveningMilking")}</span>
                <span className={`font-medium ${
                  eveningStatus === 'completed' ? 'text-success' :
                  eveningStatus === 'in_progress' ? 'text-warning' : 'text-muted-foreground'
                }`}>
                  {eveningStatus === 'completed' ? t("dashboard.completed") :
                   eveningStatus === 'in_progress' ? t("dashboard.inProgress") :
                   `${t("dashboard.pending")} ${eveningTime}`}
                </span>
              </div>
              <Progress value={eveningStatus === 'completed' ? 100 : 0} className="h-2" />
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">{t("dashboard.noData")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
