import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, Download, BarChart3, Filter, TrendingUp, DollarSign, CalendarIcon, ChevronDown, ChevronUp, X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { generateProductionReport, downloadPDFReport, type ReportRequest, type ProductionReportData } from "@/services/reports";
import { useTenantSettings } from "@/hooks/useTenantSettings";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useQuery } from "@tanstack/react-query";
import { getLabelSuggestions, listAnimals } from "@/services/animals";
import { getBreeds } from "@/services/breeds";
import { getLots } from "@/services/lots";
import { getAnimalStatuses } from "@/services/animals";
import DailyDetailReport from "./DailyDetailReport";

interface ProductionFilters {
  date_from: string;
  date_to: string;
  period: 'daily' | 'weekly' | 'monthly';
  include_inactive: boolean;
  animal_ids: string[];
  labels: string[];
  breed_ids: string[];
  lot_ids: string[];
  status_ids: string[];
}

export default function ProductionReport() {
  const { t, i18n } = useTranslation();
  const { data: tenantSettings } = useTenantSettings();
  const [activeTab, setActiveTab] = useState("detalle");
  const [reportData, setReportData] = useState<ProductionReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

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
      include_inactive: false,
      animal_ids: [],
      labels: [],
      breed_ids: [],
      lot_ids: [],
      status_ids: [],
    };
  });

  // Fetch data for filters
  const { data: breedsData } = useQuery({
    queryKey: ["breeds"],
    queryFn: () => getBreeds(),
  });

  const { data: lotsData } = useQuery({
    queryKey: ["lots"],
    queryFn: () => getLots(),
  });

  const { data: statusesData } = useQuery({
    queryKey: ["animal-statuses"],
    queryFn: () => getAnimalStatuses('es'),
  });

  const { data: labelsData } = useQuery({
    queryKey: ["all-labels"],
    queryFn: () => getLabelSuggestions(''),
  });

  const { data: animalsData } = useQuery({
    queryKey: ["animals-list-all"],
    queryFn: () => listAnimals({ limit: 500 }),
  });

  const animals = animalsData?.items || [];
  const breeds = breedsData || [];
  const lots = lotsData || [];
  const statuses = statusesData || [];
  const allLabels = labelsData || [];

  const loadReportData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: ReportRequest = {
        date_from: filters.date_from,
        date_to: filters.date_to,
        period: filters.period,
        format: 'json',
        filters: {
          animal_ids: filters.animal_ids.length > 0 ? filters.animal_ids : undefined,
          labels: filters.labels.length > 0 ? filters.labels : undefined,
          breed_ids: filters.breed_ids.length > 0 ? filters.breed_ids : undefined,
          lot_ids: filters.lot_ids.length > 0 ? filters.lot_ids : undefined,
          status_ids: filters.status_ids.length > 0 ? filters.status_ids : undefined,
          include_inactive: filters.include_inactive,
        }
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

  // Parse a date string that may be "dd/mm" (no year) by inferring
  // the correct year from the report period range (handles cross-year periods).
  const parseDateString = (dateString: string): Date => {
    if (dateString.match(/^\d{1,2}\/\d{1,2}$/)) {
      const [day, month] = dateString.split('/');
      const m = parseInt(month) - 1;
      const d = parseInt(day);

      const fromDate = reportData?.summary?.period_from
        ? new Date(reportData.summary.period_from)
        : null;
      const toDate = reportData?.summary?.period_to
        ? new Date(reportData.summary.period_to)
        : null;

      if (fromDate && toDate && fromDate.getFullYear() !== toDate.getFullYear()) {
        // Cross-year period: if the month is <= the end month of the end year,
        // and the month is < the start month of the start year, use end year
        const startYear = fromDate.getFullYear();
        const endYear = toDate.getFullYear();
        const startMonth = fromDate.getMonth();
        // If month is before the start month, it belongs to the next year
        const year = m < startMonth ? endYear : startYear;
        return new Date(year, m, d);
      }

      const year = fromDate?.getFullYear() ?? new Date().getFullYear();
      return new Date(year, m, d);
    }
    return new Date(dateString);
  };

  // Helper functions for date formatting and calculations
  const formatDate = (dateString: string) => {
    try {
      const date = parseDateString(dateString);

      if (isNaN(date.getTime())) {
        return { formatted: t('forms.invalidDate'), dayName: '' };
      }

      return {
        formatted: date.toLocaleDateString(i18n.language || 'es-EC', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }),
        dayName: date.toLocaleDateString(i18n.language || 'es-EC', { weekday: 'long' })
      };
    } catch (error) {
      return { formatted: t('forms.invalidDate'), dayName: '' };
    }
  };

  const calculateRevenue = (liters: number): number => {
    const pricePerLiter = tenantSettings?.default_price_per_l || 0;
    return liters * pricePerLiter;
  };

  const formatCurrency = (amount: number): string => {
    const currency = tenantSettings?.default_currency || 'USD';
    return new Intl.NumberFormat(i18n.language || 'es-EC', {
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
        const revenueDelivered = calculateRevenue(deliveredLiters);
        const revenueProduced = calculateRevenue(producedLiters);

        return {
          date: formattedDate,
          dayName,
          originalDate: date,
          producidos: Number(producedLiters),
          entregados: Number(deliveredLiters),
          ingresos: Number(revenueDelivered.toFixed(2)),
          ingresos_producidos: Number(revenueProduced.toFixed(2)),
        };
      })
      .sort((a, b) => {
        return parseDateString(a.originalDate).getTime() - parseDateString(b.originalDate).getTime();
      });
  };

  // Calculate totals for the table
  const calculateTableTotals = () => {
    const data = prepareChartData();
    return {
      totalProduced: data.reduce((sum, row) => sum + row.producidos, 0),
      totalDelivered: data.reduce((sum, row) => sum + row.entregados, 0),
      totalRevenue: data.reduce((sum, row) => sum + row.ingresos, 0),
      totalRevenueProduced: data.reduce((sum, row) => sum + (row as any).ingresos_producidos, 0),
      recordCount: data.length
    };
  };

  const downloadPDF = async () => {
    try {
      const params: ReportRequest = {
        date_from: filters.date_from,
        date_to: filters.date_to,
        period: filters.period,
        format: 'pdf',
        filters: {
          animal_ids: filters.animal_ids.length > 0 ? filters.animal_ids : undefined,
          labels: filters.labels.length > 0 ? filters.labels : undefined,
          breed_ids: filters.breed_ids.length > 0 ? filters.breed_ids : undefined,
          lot_ids: filters.lot_ids.length > 0 ? filters.lot_ids : undefined,
          status_ids: filters.status_ids.length > 0 ? filters.status_ids : undefined,
          include_inactive: filters.include_inactive,
        }
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

          {/* Advanced Filters Toggle */}
          <div className="border-t pt-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2 w-full justify-between"
            >
              <span className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros Avanzados
                {(filters.animal_ids.length > 0 || filters.labels.length > 0 || filters.breed_ids.length > 0 || filters.lot_ids.length > 0 || filters.status_ids.length > 0) && (
                  <Badge variant="secondary" className="ml-2">
                    {filters.animal_ids.length + filters.labels.length + filters.breed_ids.length + filters.lot_ids.length + filters.status_ids.length}
                  </Badge>
                )}
              </span>
              {showAdvancedFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {showAdvancedFilters && (
              <div className="mt-4 space-y-4 border rounded-lg p-4 bg-muted/30">
                {/* Animals Multi-Select */}
                <div className="space-y-2">
                  <Label>Animales Específicos</Label>
                  <Select
                    value=""
                    onValueChange={(value) => {
                      if (!filters.animal_ids.includes(value)) {
                        setFilters(prev => ({ ...prev, animal_ids: [...prev.animal_ids, value] }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar animal..." />
                    </SelectTrigger>
                    <SelectContent>
                      {animals.map((a: any) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.tag} {a.name ? `- ${a.name}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {filters.animal_ids.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {filters.animal_ids.map((id) => {
                        const a = animals.find((x: any) => x.id === id);
                        return (
                          <Badge key={id} variant="outline" className="text-xs gap-1">
                            {a ? (a.name ? `${a.name} (${a.tag})` : a.tag) : id}
                            <X className="h-2 w-2 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, animal_ids: prev.animal_ids.filter(aid => aid !== id) }))} />
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Labels Multi-Select */}
                <div className="space-y-2">
                  <Label>Etiquetas</Label>
                  <Select
                    value=""
                    onValueChange={(value) => {
                      if (!filters.labels.includes(value)) {
                        setFilters(prev => ({ ...prev, labels: [...prev.labels, value] }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar etiqueta..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allLabels.map((label: string) => (
                        <SelectItem key={label} value={label}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {filters.labels.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {filters.labels.map((label) => (
                        <Badge key={label} variant="secondary" className="gap-1">
                          {label}
                          <button
                            onClick={() => setFilters(prev => ({ ...prev, labels: prev.labels.filter(l => l !== label) }))}
                            className="ml-1 hover:bg-destructive/20 rounded-full"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Breeds, Lots, Status in a grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Breeds */}
                  <div className="space-y-2">
                    <Label>Razas</Label>
                    <Select
                      value=""
                      onValueChange={(value) => {
                        if (!filters.breed_ids.includes(value)) {
                          setFilters(prev => ({ ...prev, breed_ids: [...prev.breed_ids, value] }));
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {breeds.map((breed: any) => (
                          <SelectItem key={breed.id} value={breed.id}>
                            {breed.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {filters.breed_ids.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {filters.breed_ids.map((id) => {
                          const breed = breeds.find((b: any) => b.id === id);
                          return (
                            <Badge key={id} variant="outline" className="text-xs gap-1">
                              {breed?.name || id}
                              <X className="h-2 w-2 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, breed_ids: prev.breed_ids.filter(bid => bid !== id) }))} />
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Lots */}
                  <div className="space-y-2">
                    <Label>Lotes</Label>
                    <Select
                      value=""
                      onValueChange={(value) => {
                        if (!filters.lot_ids.includes(value)) {
                          setFilters(prev => ({ ...prev, lot_ids: [...prev.lot_ids, value] }));
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {lots.map((lot: any) => (
                          <SelectItem key={lot.id} value={lot.id}>
                            {lot.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {filters.lot_ids.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {filters.lot_ids.map((id) => {
                          const lot = lots.find((l: any) => l.id === id);
                          return (
                            <Badge key={id} variant="outline" className="text-xs gap-1">
                              {lot?.name || id}
                              <X className="h-2 w-2 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, lot_ids: prev.lot_ids.filter(lid => lid !== id) }))} />
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <Label>Estados</Label>
                    <Select
                      value=""
                      onValueChange={(value) => {
                        if (!filters.status_ids.includes(value)) {
                          setFilters(prev => ({ ...prev, status_ids: [...prev.status_ids, value] }));
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((status: any) => (
                          <SelectItem key={status.id} value={status.id}>
                            {status.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {filters.status_ids.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {filters.status_ids.map((id) => {
                          const status = statuses.find((s: any) => s.id === id);
                          return (
                            <Badge key={id} variant="outline" className="text-xs gap-1">
                              {status?.name || id}
                              <X className="h-2 w-2 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, status_ids: prev.status_ids.filter(sid => sid !== id) }))} />
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
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
          <TabsTrigger value="detalle">{t('reports.dailyDetail')}</TabsTrigger>
          <TabsTrigger value="summary">{t("reports.summary")}</TabsTrigger>
          <TabsTrigger value="charts">{t("reports.charts")}</TabsTrigger>
          <TabsTrigger value="tables">{t("reports.tables")}</TabsTrigger>
        </TabsList>

        {/* Detalle Diario Tab */}
        <TabsContent value="detalle" className="space-y-4">
          {reportData && <DailyDetailReport reportData={reportData} />}
        </TabsContent>

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
                        <p className="text-sm text-muted-foreground">{animal.avg_per_day.toFixed(1)}L/{t('reports.dayOfWeek').toLowerCase()}</p>
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
                          // Add padding so low values (e.g., today) are visible
                          domain={[
                            (dataMin: number) => Math.max(0, Math.floor(dataMin - 10)),
                            (dataMax: number) => Math.ceil(dataMax + 10),
                          ]}
                        />
                        <YAxis
                          yAxisId="ingresos"
                          orientation="right"
                          tick={{ fontSize: 12 }}
                          // Add ~10% headroom and floor at zero
                          domain={[
                            (dataMin: number) => Math.max(0, Math.floor(dataMin * 0.9)),
                            (dataMax: number) => Math.ceil(dataMax * 1.1),
                          ]}
                        />
                        <Tooltip
                          formatter={(value: number, name: string) => {
                            if (name === 'producidos') return [`${value.toLocaleString()}L`, t("reports.litersProduced")];
                            if (name === 'entregados') return [`${value.toLocaleString()}L`, t("reports.litersDelivered")];
                            if (name === 'ingresos') return [formatCurrency(value), t("reports.totalRevenue")];
                            return [value, name];
                          }}
                          labelFormatter={(label: string) => `${t('reports.dateLabel')}: ${label}`}
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
                          <th className="border border-border p-2 text-right">{t("reports.produced")} ({tenantSettings?.default_currency || 'USD'})</th>
                          <th className="border border-border p-2 text-right">{t("reports.delivered")} ({tenantSettings?.default_currency || 'USD'})</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prepareChartData()
                          .sort((a, b) => {
                            return parseDateString(b.originalDate).getTime() - parseDateString(a.originalDate).getTime();
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
                              <td className="border border-border p-2 text-right font-medium text-blue-700">
                                {row.producidos > 0 ? formatCurrency((row as any).ingresos_producidos) : '-'}
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
                          <td className="border border-border p-2 text-right font-bold text-blue-700">
                            {calculateTableTotals().totalRevenueProduced > 0 ? formatCurrency(calculateTableTotals().totalRevenueProduced) : '-'}
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
                  {/* Mobile Totals Card (moved to top on mobile) */}
                  <div className="border-2 border-primary rounded-lg p-4 bg-muted/50">
                    <div className="flex justify-between items-center mb-3">
                      <div className="font-bold text-lg">{t("reports.total")}</div>
                      <div className="text-sm text-muted-foreground">
                        {calculateTableTotals().recordCount} {t("reports.records")}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div className="space-y-2">
                        <div>
                          <span className="text-muted-foreground text-xs">{t("reports.produced")}: </span>
                          <span className="font-bold text-blue-600">
                            {calculateTableTotals().totalProduced > 0
                              ? `(${calculateTableTotals().totalProduced.toLocaleString()}L) ${formatCurrency(calculateTableTotals().totalRevenueProduced)}`
                              : '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs">{t("reports.delivered")}: </span>
                          <span className="font-bold text-green-600">
                            {calculateTableTotals().totalDelivered > 0
                              ? `(${calculateTableTotals().totalDelivered.toLocaleString()}L) ${formatCurrency(calculateTableTotals().totalRevenue)}`
                              : '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {prepareChartData()
                    .sort((a, b) => {
                      return parseDateString(b.originalDate).getTime() - parseDateString(a.originalDate).getTime();
                    })
                    .map((row) => (
                      <div key={row.originalDate} className="border border-border rounded-lg p-3 bg-card">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="font-medium">{row.date}</div>
                            <div className="text-sm text-muted-foreground capitalize">{row.dayName}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-3 text-sm">
                          <div className="space-y-2">
                            <div>
                              <span className="text-muted-foreground text-xs">{t("reports.produced")}: </span>
                              <span className="font-medium text-blue-600">
                                {row.producidos > 0 ? `(${row.producidos.toLocaleString()}L) ${formatCurrency((row as any).ingresos_producidos)}` : '-'}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs">{t("reports.delivered")}: </span>
                              <span className="font-medium text-green-600">
                                {row.entregados > 0 ? `(${row.entregados.toLocaleString()}L) ${formatCurrency(row.ingresos)}` : '-'}
                              </span>
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
