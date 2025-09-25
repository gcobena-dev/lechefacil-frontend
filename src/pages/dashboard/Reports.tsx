import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, AlertTriangle, BarChart3, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { useReportDefinitions } from "@/hooks/useReports";
import ProductionReport from "@/components/reports/ProductionReport";
import AnimalsReport from "@/components/reports/AnimalsReport";

export default function Reports() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("production");

  const { data: definitions, isLoading, error } = useReportDefinitions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{t("reports.loadingDefinitions")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">{t("reports.errorLoadingDefinitions")}</h2>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t("dashboard.retry")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t("reports.title")}</h1>
          <p className="text-muted-foreground text-sm sm:text-base">{t("reports.subtitle")}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="production" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {t("reports.productionReport")}
          </TabsTrigger>
          <TabsTrigger value="animals" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t("reports.animalsReport")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="production" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {t("reports.productionReport")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProductionReport />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="animals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t("reports.animalsReport")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnimalsReport />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}