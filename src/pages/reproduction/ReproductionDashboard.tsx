import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { useInseminations, usePendingPregnancyChecks, useSires } from "@/hooks/useReproduction";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Plus,
  AlertCircle,
  ClipboardCheck,
  ListChecks,
  Package,
} from "lucide-react";

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  CONFIRMED: "default",
  OPEN: "outline",
  LOST: "destructive",
};

export default function ReproductionDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: inseminationsData } = useInseminations({ limit: 5 });
  const { data: pendingChecks } = usePendingPregnancyChecks();
  const { data: siresData } = useSires({ limit: 1 });
  const { data: confirmedData } = useInseminations({ pregnancy_status: "CONFIRMED", limit: 1 });

  const totalInseminations = inseminationsData?.total ?? 0;
  const pendingCount = pendingChecks?.length ?? 0;
  const confirmedCount = confirmedData?.total ?? 0;
  const recentInseminations = inseminationsData?.items ?? [];

  return (
    <div className="space-y-6 p-4 md:p-6">
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500" />
              <div>
                <p className="text-2xl font-bold">{totalInseminations}</p>
                <p className="text-xs text-muted-foreground">
                  {t("reproduction.activeInseminations")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">
                  {t("reproduction.pendingChecks")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{confirmedCount}</p>
                <p className="text-xs text-muted-foreground">
                  {t("reproduction.confirmedPregnancies")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{siresData?.total ?? 0}</p>
                <p className="text-xs text-muted-foreground">
                  {t("reproduction.sires")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("reproduction.quickActions")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              variant="outline"
              className="h-auto py-3 flex-col gap-1"
              onClick={() => navigate("/reproduction/inseminations/new")}
            >
              <Plus className="h-5 w-5" />
              <span className="text-xs">{t("reproduction.recordInsemination")}</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 flex-col gap-1"
              onClick={() => navigate("/reproduction/pregnancy-checks")}
            >
              <ClipboardCheck className="h-5 w-5" />
              <span className="text-xs">{t("reproduction.pregnancyChecks")}</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 flex-col gap-1"
              onClick={() => navigate("/reproduction/sires")}
            >
              <Heart className="h-5 w-5" />
              <span className="text-xs">{t("reproduction.sireCatalog")}</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 flex-col gap-1"
              onClick={() => navigate("/reproduction/semen")}
            >
              <Package className="h-5 w-5" />
              <span className="text-xs">{t("reproduction.semenInventory")}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pending Checks Alert */}
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

      {/* Recent Inseminations */}
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
