import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users, Download, Filter, Activity, CheckCircle, XCircle, CalendarIcon } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { generateAnimalsReport, downloadPDFReport, type ReportRequest, type AnimalsReportData } from "@/services/reports";
import { getAnimalStatuses } from "@/services/animals";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { getStatusKeyFromCode } from "@/utils/animals";

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

  const { data: animalStatuses = [] } = useQuery({
    queryKey: ["animal-statuses"],
    queryFn: () => getAnimalStatuses('es'),
  });

  // Helper function to get local date in YYYY-MM-DD format
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Default filters - today
  const [filters, setFilters] = useState<AnimalsFilters>(() => {
    const today = new Date();

    return {
      date_from: getLocalDateString(today),
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

  const setQuickDateRange = (range: 'today' | 'lastWeek' | 'lastMonth' | 'last3Months' | 'thisYear') => {
    const today = new Date();
    const startDate = new Date();

    switch (range) {
      case 'today':
        // Set both dates to today - create fresh date instance
        const currentDate = new Date();
        setFilters(prev => ({
          ...prev,
          date_from: getLocalDateString(currentDate),
          date_to: getLocalDateString(currentDate)
        }));
        return;
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

  

  const getStatusBadge = (statusLabelOrCode: string) => {
    // Resolve incoming value (may be a code from backend in future, or a localized name from current report)
    const resolved = animalStatuses.find(
      s => s.code === statusLabelOrCode || s.name.toLowerCase() === statusLabelOrCode.toLowerCase()
    );
    const code = resolved?.code || statusLabelOrCode.toUpperCase();
    const name = resolved?.name || statusLabelOrCode;
    const description = resolved?.description;

    // Use the proper status determination function
    const statusKey = getStatusKeyFromCode(code);
    const isActive = statusKey === 'active';

    // Visual style map per status code
    const style: Record<string, { cls: string }> = {
      CALF: { cls: "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900 dark:text-sky-200 dark:border-sky-700" },
      HEIFER: { cls: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900 dark:text-indigo-200 dark:border-indigo-700" },
      PREGNANT_HEIFER: { cls: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700" },
      LACTATING: { cls: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700" },
      DRY: { cls: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-700" },
      PREGNANT_DRY: { cls: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700" },
      BULL: { cls: "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600" },
      SOLD: { cls: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600" },
      DEAD: { cls: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700" },
      CULLED: { cls: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900 dark:text-rose-200 dark:border-rose-700" },
    };

    const s = style[code] || { cls: "bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-600" };

    return (
      <Badge variant="outline" className={`flex items-center gap-1 border ${s.cls}`}>
        {isActive ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
        <span title={description}>{name}</span>
      </Badge>
    );
  };

  // Filter animals based on active/inactive status
  const getFilteredAnimals = () => {
    if (!reportData?.animals) return [];

    return reportData.animals.filter(animal => {
      // Resolve status that may arrive as localized label or backend code
      const resolved = animalStatuses.find(
        s => s.code === animal.status || s.name.toLowerCase() === (animal.status ?? '').toLowerCase()
      );
      const code = resolved?.code || (animal.status ?? '').toUpperCase();
      const statusKey = getStatusKeyFromCode(code);
      const isActive = statusKey === 'active';

      // If include_inactive is false, only show active animals
      // If include_inactive is true, show all animals
      return filters.include_inactive || isActive;
    });
  };

  // Calculate totals for filtered animals table
  const calculateAnimalsTotals = () => {
    const filteredAnimals = getFilteredAnimals();

    return {
      totalAnimals: filteredAnimals.length,
      totalLiters: filteredAnimals.reduce((sum, animal) => sum + animal.total_liters, 0),
      totalRecords: filteredAnimals.reduce((sum, animal) => sum + animal.records_count, 0),
      avgPerRecord: filteredAnimals.length > 0
        ? filteredAnimals.reduce((sum, animal) => sum + animal.avg_per_record, 0) / filteredAnimals.length
        : 0
    };
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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickDateRange('today')}
                type="button"
              >
                {t("reports.today")}
              </Button>
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
              <div className="relative">
                <Input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
                  className="cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 pr-10"
                />
                <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("reports.dateTo")}</Label>
              <div className="relative">
                <Input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
                  className="cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 pr-10"
                />
                <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="include_inactive"
                checked={filters.include_inactive}
                onChange={(e) => setFilters(prev => ({ ...prev, include_inactive: e.target.checked }))}
                className="rounded border-input"
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

          {reportData && getFilteredAnimals().length > 0 && (
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
                      data={getFilteredAnimals()
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
              {getFilteredAnimals().filter(animal => animal.records_count > 0).length > 0 && (
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
                        data={getFilteredAnimals()
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

          {reportData && (!reportData.animals || getFilteredAnimals().length === 0) && (
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
          {reportData?.animals && getFilteredAnimals().length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("reports.animalPerformance")}</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Desktop Table */}
                <div className="hidden md:block">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-border">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="border border-border p-2 text-left">{t("common.name")}</th>
                          <th className="border border-border p-2 text-left">Tag</th>
                          <th className="border border-border p-2 text-center">{t("reports.animalStatus")}</th>
                          <th className="border border-border p-2 text-right">{t("reports.totalLiters")}</th>
                          <th className="border border-border p-2 text-right">{t("reports.recordsCount")}</th>
                          <th className="border border-border p-2 text-right">{t("reports.avgPerRecord")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredAnimals()
                          .sort((a, b) => b.total_liters - a.total_liters)
                          .map((animal) => (
                            <tr key={animal.tag} className="hover:bg-muted/30">
                              <td className="border border-border p-2 font-medium">{animal.name}</td>
                              <td className="border border-border p-2 text-muted-foreground">{animal.tag}</td>
                              <td className="border border-border p-2 text-center">
                                {getStatusBadge(animal.status)}
                              </td>
                              <td className="border border-border p-2 text-right font-medium">
                                {animal.total_liters.toLocaleString()}L
                              </td>
                              <td className="border border-border p-2 text-right">
                                {animal.records_count}
                              </td>
                              <td className="border border-border p-2 text-right">
                                {animal.avg_per_record.toFixed(1)}L
                              </td>
                            </tr>
                          ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-muted/70 border-t-2 border-primary font-semibold">
                          <td className="border border-border p-2 font-bold">{t("reports.total")}</td>
                          <td className="border border-border p-2 text-muted-foreground">
                            {calculateAnimalsTotals().totalAnimals} {t("animals.animalsFound")}
                          </td>
                          <td className="border border-border p-2 text-center">-</td>
                          <td className="border border-border p-2 text-right font-bold text-blue-600">
                            {calculateAnimalsTotals().totalLiters.toLocaleString()}L
                          </td>
                          <td className="border border-border p-2 text-right font-bold text-green-600">
                            {calculateAnimalsTotals().totalRecords.toLocaleString()}
                          </td>
                          <td className="border border-border p-2 text-right font-bold text-purple-600">
                            {calculateAnimalsTotals().avgPerRecord.toFixed(1)}L
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {getFilteredAnimals()
                    .sort((a, b) => b.total_liters - a.total_liters)
                    .map((animal) => (
                      <div key={animal.tag} className="border border-border rounded-lg p-3 bg-card">
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

                  {/* Mobile Totals Card */}
                  <div className="border-2 border-primary rounded-lg p-4 bg-muted/50">
                    <div className="flex justify-between items-center mb-3">
                      <div className="font-bold text-lg">{t("reports.total")}</div>
                      <div className="text-sm text-muted-foreground">
                        {calculateAnimalsTotals().totalAnimals} {t("animals.animalsFound")}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="space-y-2">
                        <div>
                          <span className="text-muted-foreground text-xs">{t("reports.totalLiters")}: </span>
                          <span className="font-bold text-blue-600">
                            {calculateAnimalsTotals().totalLiters.toLocaleString()}L
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs">{t("reports.recordsCount")}: </span>
                          <span className="font-bold text-green-600">
                            {calculateAnimalsTotals().totalRecords.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">{t("reports.avgPerRecord")}</div>
                        <div className="font-bold text-lg text-purple-600">
                          {calculateAnimalsTotals().avgPerRecord.toFixed(1)}L
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
