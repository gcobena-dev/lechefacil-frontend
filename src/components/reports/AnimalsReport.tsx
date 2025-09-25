import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users, Download, Filter, Activity, CheckCircle, XCircle } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { generateAnimalsReport, downloadPDFReport, type ReportRequest, type AnimalsReportData } from "@/services/reports";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface AnimalsFilters {
  date_from: string;
  date_to: string;
  include_inactive: boolean;
}

export default function AnimalsReport() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("summary");
  const [reportData, setReportData] = useState<AnimalsReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Helper function to get local date in YYYY-MM-DD format
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Default filters - last month
  const [filters, setFilters] = useState<AnimalsFilters>(() => {
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(today.getMonth() - 1);

    return {
      date_from: getLocalDateString(lastMonth),
      date_to: getLocalDateString(today),
      include_inactive: false
    };
  });

  const loadReportData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: ReportRequest = {
        ...filters,
        format: 'json'
      };

      const response = await generateAnimalsReport(params);

      if (response.data) {
        setReportData(response.data as AnimalsReportData);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`${t("reports.animalsReportError")}: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [filters, t]);

  const downloadPDF = async () => {
    try {
      const params: ReportRequest = {
        ...filters,
        format: 'pdf'
      };

      const response = await generateAnimalsReport(params);
      downloadPDFReport(response);
      toast.success(t("reports.animalsReportSuccess"));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`${t("reports.animalsReportError")}: ${errorMessage}`);
    }
  };

  const setQuickDateRange = (range: 'lastWeek' | 'lastMonth' | 'last3Months' | 'thisYear') => {
    const today = new Date();
    const startDate = new Date();

    switch (range) {
      case 'lastWeek':
        startDate.setDate(today.getDate() - 7);
        break;
      case 'lastMonth':
        startDate.setMonth(today.getMonth() - 1);
        break;
      case 'last3Months':
        startDate.setMonth(today.getMonth() - 3);
        break;
      case 'thisYear':
        startDate.setMonth(0);
        startDate.setDate(1);
        break;
    }

    setFilters(prev => ({
      ...prev,
      date_from: getLocalDateString(startDate),
      date_to: getLocalDateString(today)
    }));
  };

  const getStatusBadge = (status: string) => {
    const isActive = status.toLowerCase() === 'active' || status.toLowerCase() === 'activo';
    return (
      <Badge variant={isActive ? "default" : "secondary"} className="flex items-center gap-1">
        {isActive ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
        {isActive ? t("common.active") : t("common.inactive")}
      </Badge>
    );
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    loadReportData();
  }, [filters, loadReportData]);

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            {t("reports.filters")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick date range buttons */}
          <div className="space-y-2">
            <Label>{t("reports.selectPeriod")}</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickDateRange('lastWeek')}
                type="button"
              >
                {t("reports.lastWeek")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickDateRange('lastMonth')}
                type="button"
              >
                {t("reports.lastMonth")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickDateRange('last3Months')}
                type="button"
              >
                {t("reports.last3Months")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickDateRange('thisYear')}
                type="button"
              >
                {t("reports.thisYear")}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("reports.dateFrom")}</Label>
              <Input
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("reports.dateTo")}</Label>
              <Input
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="include_inactive"
                checked={filters.include_inactive}
                onChange={(e) => setFilters(prev => ({ ...prev, include_inactive: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="include_inactive">{t("reports.includeInactiveAnimals")}</Label>
            </div>

            <Button onClick={downloadPDF} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              {t("reports.downloadPDF")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Visualization Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="summary">{t("reports.summary")}</TabsTrigger>
          <TabsTrigger value="charts">{t("reports.charts")}</TabsTrigger>
          <TabsTrigger value="tables">{t("reports.tables")}</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          {reportData?.summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t("reports.totalAnimals")}</p>
                      <p className="text-2xl font-bold">{reportData.summary.total_animals}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t("reports.activeAnimals")}</p>
                      <p className="text-2xl font-bold">{reportData.summary.active_animals}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t("reports.inactiveAnimals")}</p>
                      <p className="text-2xl font-bold">{reportData.summary.inactive_animals}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          {!reportData && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">{isLoading ? t("common.loading") : t("reports.noDataAvailable")}</p>
            </div>
          )}

          {reportData && reportData.animals && (
            <div className="space-y-6">
              {/* Status Distribution Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    {t("reports.animalStatusDistribution")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: t("common.active"), value: reportData.summary?.active_animals || 0, color: '#22c55e' },
                          { name: t("common.inactive"), value: reportData.summary?.inactive_animals || 0, color: '#6b7280' }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[
                          { name: t("common.active"), value: reportData.summary?.active_animals || 0, color: '#22c55e' },
                          { name: t("common.inactive"), value: reportData.summary?.inactive_animals || 0, color: '#6b7280' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Performers Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {t("reports.topPerformers")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={reportData.animals
                        .filter(animal => animal.total_liters > 0)
                        .sort((a, b) => b.total_liters - a.total_liters)
                        .slice(0, 10)
                        .map(animal => ({
                          name: animal.name || animal.tag,
                          totalLiters: animal.total_liters,
                          avgPerRecord: Number(animal.avg_per_record.toFixed(1))
                        }))
                      }
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        interval={0}
                      />
                      <YAxis />
                      <Tooltip
                        formatter={(value, name) => [
                          `${value}L`,
                          name === 'totalLiters' ? t("reports.totalLiters") : t("reports.avgPerRecord")
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="totalLiters" fill="#3b82f6" name={t("reports.totalLiters")} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Production Average Bar Chart */}
              {reportData.animals.filter(animal => animal.records_count > 0).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      {t("reports.averageProduction")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart
                        data={reportData.animals
                          .filter(animal => animal.records_count > 0)
                          .sort((a, b) => b.avg_per_record - a.avg_per_record)
                          .slice(0, 10)
                          .map(animal => ({
                            name: animal.name || animal.tag,
                            avgProduction: Number(animal.avg_per_record.toFixed(1)),
                            recordsCount: animal.records_count
                          }))
                        }
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="name"
                          angle={-45}
                          textAnchor="end"
                          height={100}
                          interval={0}
                        />
                        <YAxis />
                        <Tooltip
                          formatter={(value, name) => [
                            name === 'avgProduction' ? `${value}L` : `${value}`,
                            name === 'avgProduction' ? t("reports.avgPerRecord") : t("reports.recordsCount")
                          ]}
                        />
                        <Legend />
                        <Bar dataKey="avgProduction" fill="#10b981" name={t("reports.avgPerRecord")} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {reportData && (!reportData.animals || reportData.animals.length === 0) && (
            <Card>
              <CardContent className="py-8">
                <p className="text-muted-foreground text-center">
                  {t("reports.noAnimalsDataForCharts")}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tables" className="space-y-4">
          {reportData?.animals && reportData.animals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("reports.animalPerformance")}</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Desktop Table */}
                <div className="hidden md:block">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-200 p-2 text-left">{t("common.name")}</th>
                          <th className="border border-gray-200 p-2 text-left">Tag</th>
                          <th className="border border-gray-200 p-2 text-center">{t("reports.animalStatus")}</th>
                          <th className="border border-gray-200 p-2 text-right">{t("reports.totalLiters")}</th>
                          <th className="border border-gray-200 p-2 text-right">{t("reports.recordsCount")}</th>
                          <th className="border border-gray-200 p-2 text-right">{t("reports.avgPerRecord")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.animals
                          .sort((a, b) => b.total_liters - a.total_liters)
                          .map((animal) => (
                            <tr key={animal.tag} className="hover:bg-gray-50">
                              <td className="border border-gray-200 p-2 font-medium">{animal.name}</td>
                              <td className="border border-gray-200 p-2 text-muted-foreground">{animal.tag}</td>
                              <td className="border border-gray-200 p-2 text-center">
                                {getStatusBadge(animal.status)}
                              </td>
                              <td className="border border-gray-200 p-2 text-right font-medium">
                                {animal.total_liters.toLocaleString()}L
                              </td>
                              <td className="border border-gray-200 p-2 text-right">
                                {animal.records_count}
                              </td>
                              <td className="border border-gray-200 p-2 text-right">
                                {animal.avg_per_record.toFixed(1)}L
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {reportData.animals
                    .sort((a, b) => b.total_liters - a.total_liters)
                    .map((animal) => (
                      <div key={animal.tag} className="border border-gray-200 rounded-lg p-3 bg-white">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="font-medium">{animal.name}</div>
                            <div className="text-sm text-muted-foreground">{animal.tag}</div>
                          </div>
                          <div>
                            {getStatusBadge(animal.status)}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="space-y-2">
                            <div>
                              <span className="text-muted-foreground text-xs">{t("reports.totalLiters")}: </span>
                              <span className="font-medium text-blue-600">
                                {animal.total_liters.toLocaleString()}L
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs">{t("reports.recordsCount")}: </span>
                              <span className="font-medium">
                                {animal.records_count}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">{t("reports.avgPerRecord")}</div>
                            <div className="font-medium text-green-600">
                              {animal.avg_per_record.toFixed(1)}L
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}