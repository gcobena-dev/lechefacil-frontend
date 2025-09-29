import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Download, BarChart3, Filter, TrendingUp, DollarSign, CalendarIcon } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { generateProductionReport, downloadPDFReport, type ReportRequest, type ProductionReportData } from "@/services/reports";
import { useTenantSettings } from "@/hooks/useTenantSettings";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ProductionFilters {
  date_from: string;
  date_to: string;
  period: 'daily' | 'weekly' | 'monthly';
  include_inactive: boolean;
}

export default function ProductionReport() {
  const { t } = useTranslation();
  const { data: tenantSettings } = useTenantSettings();
  const [activeTab, setActiveTab] = useState("summary");
  const [reportData, setReportData] = useState<ProductionReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Helper function to get local date in YYYY-MM-DD format
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Default filters - today
  const [filters, setFilters] = useState<ProductionFilters>(() => {
    const today = new Date();

    return {
      date_from: getLocalDateString(today),
      date_to: getLocalDateString(today),
      period: 'daily',
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

      const response = await generateProductionReport(params);

      if (response.data) {
        setReportData(response.data as ProductionReportData);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`${t("reports.productionReportError")}: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [filters, t]);

  // Helper functions for date formatting and calculations
  const formatDate = (dateString: string) => {
    try {
      let date: Date;

      // Handle format like "21/09" (day/month without year)
      if (dateString.match(/^\d{1,2}\/\d{1,2}$/)) {
        const [day, month] = dateString.split('/');
        // Use current year or year from the report period
        const currentYear = reportData?.summary?.period_from ?
          new Date(reportData.summary.period_from).getFullYear() :
          new Date().getFullYear();

        // Create date avoiding timezone issues by using the Date constructor with separate parameters
        date = new Date(currentYear, parseInt(month) - 1, parseInt(day));
      } else {
        date = new Date(dateString);
      }

      if (isNaN(date.getTime())) {
        return { formatted: 'Invalid Date', dayName: '' };
      }

      return {
        formatted: date.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }),
        dayName: date.toLocaleDateString('es-ES', { weekday: 'long' })
      };
    } catch (error) {
      return { formatted: 'Invalid Date', dayName: '' };
    }
  };

  const calculateRevenue = (liters: number): number => {
    const pricePerLiter = tenantSettings?.default_price_per_l || 0;
    return liters * pricePerLiter;
  };

  const formatCurrency = (amount: number): string => {
    const currency = tenantSettings?.default_currency || 'USD';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  // Prepare chart data combining production and delivery data
  const prepareChartData = () => {
    if (!reportData?.period_production_data && !reportData?.period_delivery_data) return [];

    // Get all unique dates from both datasets
    const allDates = new Set([
      ...Object.keys(reportData.period_production_data || {}),
      ...Object.keys(reportData.period_delivery_data || {})
    ]);


    return Array.from(allDates)
      .map((date) => {
        const { formatted: formattedDate, dayName } = formatDate(date);
        const producedLiters = reportData.period_production_data?.[date] || 0;
        const deliveredLiters = reportData.period_delivery_data?.[date] || 0;
        const revenue = calculateRevenue(deliveredLiters); // Revenue based on delivered liters

        return {
          date: formattedDate,
          dayName,
          originalDate: date,
          producidos: Number(producedLiters),
          entregados: Number(deliveredLiters),
          ingresos: Number(revenue.toFixed(2))
        };
      })
      .sort((a, b) => {
        // Sort by original date format for chronological order
        const parseDate = (dateStr: string) => {
          if (dateStr.match(/^\d{1,2}\/\d{1,2}$/)) {
            const [day, month] = dateStr.split('/');
            const currentYear = reportData?.summary?.period_from ?
              new Date(reportData.summary.period_from).getFullYear() :
              new Date().getFullYear();
            // Use Date constructor with separate parameters to avoid timezone issues
            return new Date(currentYear, parseInt(month) - 1, parseInt(day));
          }
          return new Date(dateStr);
        };
        return parseDate(a.originalDate).getTime() - parseDate(b.originalDate).getTime();
      });
  };

  // Calculate totals for the table
  const calculateTableTotals = () => {
    const data = prepareChartData();
    return {
      totalProduced: data.reduce((sum, row) => sum + row.producidos, 0),
      totalDelivered: data.reduce((sum, row) => sum + row.entregados, 0),
      totalRevenue: data.reduce((sum, row) => sum + row.ingresos, 0),
      recordCount: data.length
    };
  };

  const downloadPDF = async () => {
    try {
      const params: ReportRequest = {
        ...filters,
        format: 'pdf'
      };

      const response = await generateProductionReport(params);
      downloadPDFReport(response);
      toast.success(t("reports.productionReportSuccess"));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`${t("reports.productionReportError")}: ${errorMessage}`);
    }
  };

  const setQuickDateRange = (range: 'today' | 'lastWeek' | 'lastMonth' | 'last3Months' | 'thisYear') => {
    const today = new Date();
    const startDate = new Date();

    switch (range) {
      case 'today': {
        // Set both dates to today - create fresh date instance
        const currentDate = new Date();
        const todayString = getLocalDateString(currentDate);
        setFilters(prev => ({
          ...prev,
          date_from: todayString,
          date_to: todayString
        }));
        return;
      }
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div className="space-y-2">
              <Label>{t("reports.period")}</Label>
              <Select
                value={filters.period}
                onValueChange={(value: 'daily' | 'weekly' | 'monthly') =>
                  setFilters(prev => ({ ...prev, period: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">{t("reports.daily")}</SelectItem>
                  <SelectItem value="weekly">{t("reports.weekly")}</SelectItem>
                  <SelectItem value="monthly">{t("reports.monthly")}</SelectItem>
                </SelectContent>
              </Select>
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
            <>
              {/* First row - Production vs Delivery */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t("reports.litersProduced")}</p>
                        <p className="text-2xl font-bold">{reportData.summary.total_liters_produced.toLocaleString()}L</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t("reports.litersDelivered")}</p>
                        <p className="text-2xl font-bold">{reportData.summary.total_liters_delivered.toLocaleString()}L</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t("reports.totalRevenue")}</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(calculateRevenue(reportData.summary.total_liters_delivered))}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Second row - Additional metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t("reports.totalRecords")}</p>
                        <p className="text-2xl font-bold">{reportData.summary.total_records}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-orange-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t("reports.difference")}</p>
                        <p className={`text-2xl font-bold ${reportData.summary.retention_difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {reportData.summary.retention_difference >= 0 ? '+' : ''}{reportData.summary.retention_difference.toFixed(1)}L
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t("reports.avgPerRecord")}</p>
                        <p className="text-2xl font-bold">{reportData.summary.avg_per_record.toFixed(1)}L</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {reportData?.top_producers && reportData.top_producers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("reports.topProducers")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {reportData.top_producers.slice(0, 5).map((animal, index) => (
                    <div key={animal.animal_tag} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-lg">#{index + 1}</span>
                        <div>
                          <p className="font-medium">{animal.animal_name}</p>
                          <p className="text-sm text-muted-foreground">{animal.animal_tag}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{animal.total_liters.toLocaleString()}L</p>
                        <p className="text-sm text-muted-foreground">{animal.avg_per_day.toFixed(1)}L/día</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          {!reportData && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">{isLoading ? t("common.loading") : t("reports.noDataAvailable")}</p>
            </div>
          )}

          {reportData && (
            <div className="space-y-4">
              {/* Production Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    {t("reports.dailyProduction")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ width: '100%', height: '400px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={prepareChartData()}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis
                          yAxisId="litros"
                          orientation="left"
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis
                          yAxisId="ingresos"
                          orientation="right"
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip
                          formatter={(value: number, name: string) => {
                            if (name === 'producidos') return [`${value.toLocaleString()}L`, t("reports.litersProduced")];
                            if (name === 'entregados') return [`${value.toLocaleString()}L`, t("reports.litersDelivered")];
                            if (name === 'ingresos') return [formatCurrency(value), t("reports.totalRevenue")];
                            return [value, name];
                          }}
                          labelFormatter={(label: string) => `Fecha: ${label}`}
                        />
                        <Legend />
                        <Bar
                          yAxisId="litros"
                          dataKey="producidos"
                          fill="#3B82F6"
                          name={t("reports.litersProduced")}
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          yAxisId="litros"
                          dataKey="entregados"
                          fill="#22C55E"
                          name={t("reports.litersDelivered")}
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          yAxisId="ingresos"
                          dataKey="ingresos"
                          fill="#10B981"
                          name={t("reports.totalRevenue")}
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="tables" className="space-y-4">
          {((reportData?.period_production_data && Object.keys(reportData.period_production_data).length > 0) ||
            (reportData?.period_delivery_data && Object.keys(reportData.period_delivery_data).length > 0)) && (
            <Card>
              <CardHeader>
                <CardTitle>{t("reports.dailyProduction")}</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Desktop Table */}
                <div className="hidden md:block">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-border">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="border border-border p-2 text-left">{t("reports.dateLabel")}</th>
                          <th className="border border-border p-2 text-left">{t("reports.dayOfWeek")}</th>
                          <th className="border border-border p-2 text-right">{t("reports.produced")} (L)</th>
                          <th className="border border-border p-2 text-right">{t("reports.delivered")} (L)</th>
                          <th className="border border-border p-2 text-right">Total ({tenantSettings?.default_currency || 'USD'})</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prepareChartData()
                          .sort((a, b) => {
                            // Sort by parsed date - most recent first
                            const parseDate = (dateStr: string) => {
                              if (dateStr.match(/^\d{1,2}\/\d{1,2}$/)) {
                                const [day, month] = dateStr.split('/');
                                const currentYear = reportData?.summary?.period_from ?
                                  new Date(reportData.summary.period_from).getFullYear() :
                                  new Date().getFullYear();
                                return new Date(currentYear, parseInt(month) - 1, parseInt(day));
                              }
                              return new Date(dateStr);
                            };
                            return parseDate(b.originalDate).getTime() - parseDate(a.originalDate).getTime();
                          })
                          .map((row) => (
                            <tr key={row.originalDate} className="hover:bg-muted/30">
                              <td className="border border-border p-2">{row.date}</td>
                              <td className="border border-border p-2 text-muted-foreground capitalize">{row.dayName}</td>
                              <td className="border border-border p-2 text-right font-medium text-blue-600">
                                {row.producidos > 0 ? `${row.producidos.toLocaleString()}L` : '-'}
                              </td>
                              <td className="border border-border p-2 text-right font-medium text-green-600">
                                {row.entregados > 0 ? `${row.entregados.toLocaleString()}L` : '-'}
                              </td>
                              <td className="border border-border p-2 text-right font-medium text-green-700">
                                {row.entregados > 0 ? formatCurrency(row.ingresos) : '-'}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-muted/70 border-t-2 border-primary font-semibold">
                          <td className="border border-border p-2 font-bold">{t("reports.total")}</td>
                          <td className="border border-border p-2 text-muted-foreground">
                            {calculateTableTotals().recordCount} {t("reports.records")}
                          </td>
                          <td className="border border-border p-2 text-right font-bold text-blue-600">
                            {calculateTableTotals().totalProduced > 0 ? `${calculateTableTotals().totalProduced.toLocaleString()}L` : '-'}
                          </td>
                          <td className="border border-border p-2 text-right font-bold text-green-600">
                            {calculateTableTotals().totalDelivered > 0 ? `${calculateTableTotals().totalDelivered.toLocaleString()}L` : '-'}
                          </td>
                          <td className="border border-border p-2 text-right font-bold text-green-700">
                            {calculateTableTotals().totalRevenue > 0 ? formatCurrency(calculateTableTotals().totalRevenue) : '-'}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {prepareChartData()
                    .sort((a, b) => {
                      const parseDate = (dateStr: string) => {
                        if (dateStr.match(/^\d{1,2}\/\d{1,2}$/)) {
                          const [day, month] = dateStr.split('/');
                          const currentYear = reportData?.summary?.period_from ?
                            new Date(reportData.summary.period_from).getFullYear() :
                            new Date().getFullYear();
                          return new Date(currentYear, parseInt(month) - 1, parseInt(day));
                        }
                        return new Date(dateStr);
                      };
                      return parseDate(b.originalDate).getTime() - parseDate(a.originalDate).getTime();
                    })
                    .map((row) => (
                      <div key={row.originalDate} className="border border-border rounded-lg p-3 bg-card">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="font-medium">{row.date}</div>
                            <div className="text-sm text-muted-foreground capitalize">{row.dayName}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="space-y-2">
                            <div>
                              <span className="text-muted-foreground text-xs">{t("reports.produced")}: </span>
                              <span className="font-medium text-blue-600">
                                {row.producidos > 0 ? `${row.producidos.toLocaleString()}L` : '-'}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs">{t("reports.delivered")}: </span>
                              <span className="font-medium text-green-600">
                                {row.entregados > 0 ? `${row.entregados.toLocaleString()}L` : '-'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">Total</div>
                            <div className="font-medium text-green-700">
                              {row.entregados > 0 ? formatCurrency(row.ingresos) : '-'}
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
                        {calculateTableTotals().recordCount} {t("reports.records")}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="space-y-2">
                        <div>
                          <span className="text-muted-foreground text-xs">{t("reports.produced")}: </span>
                          <span className="font-bold text-blue-600">
                            {calculateTableTotals().totalProduced > 0 ? `${calculateTableTotals().totalProduced.toLocaleString()}L` : '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs">{t("reports.delivered")}: </span>
                          <span className="font-bold text-green-600">
                            {calculateTableTotals().totalDelivered > 0 ? `${calculateTableTotals().totalDelivered.toLocaleString()}L` : '-'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Total</div>
                        <div className="font-bold text-lg text-green-700">
                          {calculateTableTotals().totalRevenue > 0 ? formatCurrency(calculateTableTotals().totalRevenue) : '-'}
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