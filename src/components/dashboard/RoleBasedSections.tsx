import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Milk,
  Plus,
  Heart,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle,
  FileText,
  DollarSign,
  Clock
} from "lucide-react";
import { Link } from "react-router-dom";
import { useWorkerProgress, useVetAlerts, useAdminOverview } from "@/hooks/useDashboard";
import { useTranslation } from "@/hooks/useTranslation";

interface RoleBasedSectionsProps {
  userRole: 'ADMIN' | 'WORKER' | 'VET';
  userId?: string;
}

export function RoleBasedSections({ userRole, userId }: RoleBasedSectionsProps) {
  const { t } = useTranslation();
  const today = new Date().toISOString().split('T')[0];

  // Fetch role-specific data
  const workerProgress = useWorkerProgress(userId || '', today);
  const vetAlerts = useVetAlerts(today);
  const adminOverview = useAdminOverview(today);
  if (userRole === 'WORKER') {
    return (
      <div className="space-y-6">
        {/* Quick Action Card for Workers */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Milk className="h-5 w-5 text-primary" />
              {t("dashboard.quickActions")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link to="/milk/collect">
                <Button className="w-full" size="lg">
                  <Plus className="w-4 h-4 mr-2" />
                  {t("dashboard.registerMilking")}
                </Button>
              </Link>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/animals">
                    {t("dashboard.viewAnimals")}
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/health">
                    {t("dashboard.reportHealth")}
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Progress for Workers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t("dashboard.myProgressToday")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {workerProgress.data ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t("dashboard.animalsMilked")}</span>
                  <Badge variant="secondary">
                    {workerProgress.data.today_progress.animals_milked}/{workerProgress.data.today_progress.total_animals_assigned}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t("dashboard.litersRecorded")}</span>
                  <span className="font-medium">{workerProgress.data.today_progress.liters_recorded}{t("dashboard.liters")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t("dashboard.currentShift")}</span>
                  <Badge>
                    {workerProgress.data.today_progress.current_shift === 'AM' ? t("dashboard.morningShift") : t("dashboard.eveningShift")}
                  </Badge>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">{t("dashboard.noData")}</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (userRole === 'VET') {
    return (
      <div className="space-y-6">
        {/* Health Alerts for Vets */}
        <Card className="border-warning/20 bg-gradient-to-br from-warning/5 to-warning/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-warning" />
              {t("dashboard.healthAlerts")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {vetAlerts.data?.urgent_alerts?.length > 0 ? (
                vetAlerts.data.urgent_alerts.slice(0, 2).map((alert) => (
                  <div key={alert.animal_id} className={`flex items-start gap-3 p-3 rounded-lg border ${
                    alert.priority === 'high' ? 'border-warning/20' : 'border-border'
                  }`}>
                    <AlertTriangle className={`h-4 w-4 mt-0.5 ${
                      alert.priority === 'high' ? 'text-warning' : 'text-muted-foreground'
                    }`} />
                    <div>
                      <p className="text-sm font-medium">{alert.animal_name} ({alert.animal_tag}) - {alert.message}</p>
                      <p className="text-xs text-muted-foreground">{alert.details}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">{t("dashboard.noData")}</p>
              )}
              <Button variant="outline" className="w-full" asChild>
                <Link to="/health">
                  <Heart className="w-4 h-4 mr-2" />
                  {t("dashboard.viewAllEvents")}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Health Summary for Vets */}
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.healthSummary")}</CardTitle>
          </CardHeader>
          <CardContent>
            {vetAlerts.data ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t("dashboard.animalsInTreatment")}</span>
                  <span className="font-medium text-warning">{vetAlerts.data.health_summary.animals_in_treatment}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t("dashboard.activeMilkWithdrawals")}</span>
                  <span className="font-medium text-destructive">{vetAlerts.data.health_summary.active_milk_withdrawals}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t("dashboard.upcomingVaccinations")}</span>
                  <span className="font-medium">{vetAlerts.data.health_summary.upcoming_vaccinations}</span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">{t("dashboard.noData")}</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ADMIN role - comprehensive overview
  return (
    <div className="space-y-6">
      {/* Quick Actions for Admin */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            {t("dashboard.quickActions")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button asChild>
              <Link to="/milk/collect">
                <Milk className="w-4 h-4 mr-2" />
                {t("dashboard.registerMilking")}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/animals">
                {t("dashboard.manageAnimals")}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/milk/prices">
                <DollarSign className="w-4 h-4 mr-2" />
                {t("dashboard.prices")}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/reports">
                <FileText className="w-4 h-4 mr-2" />
                {t("dashboard.reports")}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Management Overview for Admin */}
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.managementOverview")}</CardTitle>
        </CardHeader>
        <CardContent>
          {adminOverview.data ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t("dashboard.monthlyProfitability")}</span>
                <span className={`font-medium flex items-center gap-1 ${
                  adminOverview.data.management_overview.monthly_profitability.startsWith('+') ? 'text-success' : 'text-destructive'
                }`}>
                  {adminOverview.data.management_overview.monthly_profitability.startsWith('+') ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {adminOverview.data.management_overview.monthly_profitability}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t("dashboard.productionVsGoal")}</span>
                <span className="font-medium">{adminOverview.data.management_overview.production_vs_goal}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t("dashboard.pendingAlerts")}</span>
                <Badge variant={adminOverview.data.management_overview.pending_alerts > 0 ? "destructive" : "outline"}>
                  {adminOverview.data.management_overview.pending_alerts}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t("dashboard.upcomingTasks")}</span>
                <span className="font-medium">{adminOverview.data.management_overview.upcoming_tasks}</span>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">{t("dashboard.noData")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}