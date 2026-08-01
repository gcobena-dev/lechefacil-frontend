import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
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
  RefreshCw,
  Bell,
  Info
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatCurrency } from "@/lib/mock-data";
import { RoleBasedSections } from "@/components/dashboard/RoleBasedSections";
import { Link } from "react-router-dom";
import { useDashboardData } from "@/hooks/useDashboard";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserRole, useUserId } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import {
  getNotificationRoute,
  getNotificationBadgeVariant,
  getNotificationIconColor,
  getNotificationTypeLabel,
} from "@/utils/notification-routes";
import { getAnimalImageUrl } from "@/utils/animals";
import { AnimalPhotoLightbox } from "@/components/animals/AnimalPhotoLightbox";

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
  const navigate = useNavigate();
  const userRoleRaw = useUserRole();
  const userRole: 'ADMIN' | 'WORKER' | 'VET' =
    userRoleRaw === 'MANAGER' ? 'ADMIN'
    : userRoleRaw === 'VETERINARIAN' ? 'VET'
    : (userRoleRaw as 'ADMIN' | 'WORKER' | 'VET') || 'ADMIN';
  const userId = useUserId();
  const [retryCount, setRetryCount] = useState(0);

  // Get notifications
  const { notifications, markAsRead } = useNotifications();

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

  // If error persists after retry, logout
  useEffect(() => {
    if (hasError && retryCount >= 1) {
      const logoutAndRedirect = async () => {
        const { performLogout } = await import('@/services/auth');
        await performLogout();
        navigate('/login');
      };
      logoutAndRedirect();
    }
  }, [hasError, retryCount, navigate]);

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
    // Skeleton con la forma real de la página: nada de spinner a pantalla completa
    return (
      <div className="space-y-6" aria-busy="true" aria-label={t("dashboard.loading")}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-11 w-full sm:w-44" />
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4 sm:p-5 space-y-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-3 w-28" />
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="p-6 space-y-4">
              <Skeleton className="h-5 w-40" />
              {Array.from({ length: 4 }).map((__, j) => (
                <div key={j} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (hasError) {
    const handleRetry = () => {
      setRetryCount(prev => prev + 1);
      window.location.reload();
    };

    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">{t("dashboard.error")}</h2>
          <Button onClick={handleRetry}>
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
            <StatCard
              label={t("dashboard.litersToday")}
              value={totalLitersFixed}
              unit={t("dashboard.liters")}
              icon={Milk}
              trend={litersTrendUp ? "up" : "down"}
              trendValue={litersVsYesterday}
              hint={t("dashboard.vsYesterday")}
            />

            <StatCard
              label={t("dashboard.revenueToday")}
              value={formatCurrency(totalRevenue)}
              icon={DollarSign}
              trend={revenueTrendUp ? "up" : "down"}
              trendValue={revenueVsYesterday}
              hint={t("dashboard.vsYesterday")}
            />

            <StatCard
              label={t("dashboard.averagePerAnimal")}
              value={avgPerAnimalFixed}
              unit={t("dashboard.liters")}
              icon={Users}
              trend={averageTrendUp ? "up" : "down"}
              trendValue={averageVsYesterday}
              hint={t("dashboard.vsYesterday")}
            />

            <StatCard
              label={t("dashboard.activeAnimals")}
              value={activeAnimals}
              icon={Calendar}
              hint={t("dashboard.totalInProduction")}
            />
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
                      const animalId = animal?.animal_id || animal?.id || "";
                      const photoUrl = getAnimalImageUrl({
                        primary_photo_signed_url: animal?.primary_photo_signed_url,
                        primary_photo_url: animal?.primary_photo_url,
                      }) || "/logo.png";
                      return (
                        <Link
                          to={animalId ? `/animals/${animalId}` : "#"}
                          key={toStr(animal?.animal_id ?? animal?.id, `${index}`)}
                          className="flex items-center justify-between hover:bg-accent/50 rounded-lg px-2 py-1"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold shrink-0">
                              {index + 1}
                            </div>
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="h-10 w-10 rounded-full overflow-hidden bg-muted border border-border shrink-0">
                                {animalId ? (
                                  <AnimalPhotoLightbox
                                    animalId={animalId}
                                    primaryUrl={animal?.primary_photo_url}
                                    primarySignedUrl={animal?.primary_photo_signed_url}
                                    fallbackUrl={photoUrl}
                                    alt={name}
                                    className="h-full w-full"
                                    thumbClassName="h-full w-full"
                                  />
                                ) : (
                                  <img
                                    src={photoUrl}
                                    alt={name}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                  />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium leading-snug line-clamp-2 break-words max-w-[180px]">{name}</p>
                                <p className="text-xs text-muted-foreground truncate max-w-[140px]">{tag}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium whitespace-nowrap">{liters.toFixed(1)}{t("dashboard.liters")}</span>
                            {trend === 'up' ? (
                              <TrendingUp className="h-3.5 w-3.5 text-success" />
                            ) : trend === 'down' ? (
                              <TrendingDown className="h-3.5 w-3.5 text-warning" />
                            ) : null}
                            <span className="text-[11px] text-muted-foreground whitespace-nowrap">{trendPct}</span>
                          </div>
                        </Link>
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
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  {t("dashboard.alertsTitle")}
                </CardTitle>
                <CardDescription>{t("dashboard.alertsDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {notifications.slice(0, 2).length > 0 ? (
                    notifications.slice(0, 2).map((notification) => {
                      const route = getNotificationRoute(notification);

                      return (
                        <div
                          key={notification.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent ${
                            !notification.read ? 'bg-info/10 border-info/20' : ''
                          }`}
                          onClick={() => {
                            if (!notification.read) {
                              markAsRead([notification.id]);
                            }
                            // Navegar usando la utilidad centralizada
                            if (route) {
                              navigate(route);
                            }
                          }}
                        >
                          <AlertTriangle className={`h-4 w-4 mt-0.5 ${getNotificationIconColor(notification.type)}`} />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium">{notification.title}</p>
                            <p className="text-sm text-muted-foreground">{notification.message}</p>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={getNotificationBadgeVariant(notification.type)}
                                className="text-xs"
                              >
                                {getNotificationTypeLabel(notification.type)}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(notification.created_at).toLocaleDateString('es-EC')}
                              </span>
                            </div>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-info rounded-full mt-1" />
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-muted-foreground text-center py-4">{t("dashboard.noData")}</p>
                  )}
                  {notifications.length > 2 && (
                    <Button
                      variant="ghost"
                      className="w-full text-sm"
                      onClick={() => navigate('/notifications')}
                    >
                      {t('notifications.viewAll')}
                    </Button>
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
          <CardTitle className="flex items-center gap-2">
            {t("dashboard.dailyProgressTitle")}
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            {t("dashboard.dailyProgressDescription")}
          </CardDescription>
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
                <span className="flex items-center gap-2">
                  {t("dashboard.dailyGoal")} ({t("dashboard.expected")}: {dailyGoalTarget.toFixed(2)}{t("dashboard.liters")})
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        aria-label={t('dashboard.goalInfoDaily')}
                        className="w-6 h-6 inline-flex items-center justify-center rounded-full border text-muted-foreground hover:bg-accent"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 text-sm" side="top" align="start">
                      {t('dashboard.goalInfoDaily')}
                    </PopoverContent>
                  </Popover>
                </span>
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
