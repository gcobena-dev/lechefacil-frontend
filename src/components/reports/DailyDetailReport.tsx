import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ProductionReportData } from "@/services/reports";
import { useTenantSettings } from "@/hooks/useTenantSettings";
import { useTranslation } from "@/hooks/useTranslation";

interface DailyDetailReportProps {
  reportData: ProductionReportData;
}

export default function DailyDetailReport({ reportData }: DailyDetailReportProps) {
  const { t, i18n } = useTranslation();
  const { data: tenantSettings } = useTenantSettings();
  const [animalPage, setAnimalPage] = useState(0);
  const [animalsPerPage, setAnimalsPerPage] = useState(2);

  useEffect(() => {
    const updateAnimalsPerPage = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setAnimalsPerPage(2); // Mobile
      } else if (width < 1024) {
        setAnimalsPerPage(3); // Tablet
      } else if (width < 1536) {
        setAnimalsPerPage(6); // Desktop
      } else {
        setAnimalsPerPage(8); // Large desktop
      }
      setAnimalPage(0); // Reset to first page on resize
    };
    updateAnimalsPerPage();
    window.addEventListener('resize', updateAnimalsPerPage);
    return () => window.removeEventListener('resize', updateAnimalsPerPage);
  }, []);

  const formatCurrency = (amount: number): string => {
    const currency = tenantSettings?.default_currency || 'USD';
    return new Intl.NumberFormat(i18n.language || 'es-EC', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const daily = reportData.daily_by_animal || {};
  // Use report period year (or current year) and local Date constructor to avoid timezone shifts
  const getReportYear = () => {
    try {
      if (reportData?.summary?.period_from) {
        return new Date(reportData.summary.period_from).getFullYear();
      }
    } catch {}
    return new Date().getFullYear();
  };

  const parseDateKey = (key: string) => {
    const [dayStr, monthStr] = key.split('/') as [string, string];
    const day = parseInt(dayStr, 10);
    const month = parseInt(monthStr, 10);
    return new Date(getReportYear(), (month || 1) - 1, day || 1);
  };

  const dates = Object.keys(daily).sort((a, b) => {
    return parseDateKey(a).getTime() - parseDateKey(b).getTime();
  });

  // Paginate animals
  const totalAnimals = reportData.animals?.length || 0;
  const totalPages = Math.ceil(totalAnimals / animalsPerPage);
  const startIndex = animalPage * animalsPerPage;
  const endIndex = startIndex + animalsPerPage;
  const visibleAnimals = reportData.animals?.slice(startIndex, endIndex) || [];

  // Calculate totals per animal
  const animalTotals: Record<string, { liters: number; revenue: number }> = {};
  reportData.animals?.forEach((animal) => {
    const totalLiters = Object.values(daily).reduce((sum, dayData) => {
      const data = dayData[animal.id];
      return sum + (data?.total_liters || 0);
    }, 0);
    animalTotals[animal.id] = {
      liters: totalLiters,
      revenue: totalLiters * (tenantSettings?.default_price_per_l || 1)
    };
  });

  // Format date helper
  const formatDate = (dateKey: string) => {
    const date = parseDateKey(dateKey);
    const [day] = dateKey.split('/');
    const weekday = date.toLocaleDateString(i18n.language || 'es-EC', { weekday: 'short' });
    const monthShort = date.toLocaleDateString(i18n.language || 'es-EC', { month: 'short' });
    return `${weekday} ${day}/${monthShort}`;
  };

  return (
    <Card>
      <CardContent className="p-0">
        {/* Navigation Controls */}
        {totalPages > 1 && (
          <div className="bg-muted/30 px-3 py-2 border-b flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {t('reports.showingAnimalsRange', {
                start: startIndex + 1,
                end: Math.min(endIndex, totalAnimals),
                total: totalAnimals,
              })}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAnimalPage(p => Math.max(0, p - 1))}
                disabled={animalPage === 0}
                className="h-7 w-7 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground">
                {animalPage + 1}/{totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAnimalPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={animalPage >= totalPages - 1}
                className="h-7 w-7 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="text-xs md:text-sm md:w-full" style={{ minWidth: '100%' }}>
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="sticky left-0 bg-muted/50 z-10 px-2 md:px-4 py-2 md:py-3 text-left font-semibold w-[80px] md:w-[120px]">
                  {t('reports.dateLabel')}
                </th>
                {visibleAnimals?.map((animal) => (
                  <th key={animal.id} className="px-2 md:px-3 py-2 md:py-3 text-center font-semibold w-[70px] md:w-[80px]">
                    <div className="font-semibold">{animal.tag}</div>
                    {animal.name && <div className="text-[9px] md:text-xs text-muted-foreground font-normal whitespace-normal leading-tight">{animal.name}</div>}
                  </th>
                ))}
                <th className="sticky right-0 bg-muted/50 z-10 px-2 md:px-4 py-2 md:py-3 text-center font-semibold w-[70px] md:w-[100px] border-l">
                  <div>{t('reports.total')}</div>
                  <div className="text-[9px] md:text-xs font-normal text-muted-foreground">{t('reports.revenue')}</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {dates.map((dateKey) => {
                const dayData = daily[dateKey];
                const dayTotal = Object.values(dayData).reduce((sum, d) => sum + d.total_liters, 0);
                const dayRevenue = dayTotal * (tenantSettings?.default_price_per_l || 1);

                return (
                  <tr key={dateKey} className="border-b hover:bg-muted/30">
                    <td className="sticky left-0 bg-background z-10 px-2 md:px-4 py-2 md:py-3 font-medium text-[10px] md:text-sm">
                      {formatDate(dateKey)}
                    </td>
                    {visibleAnimals?.map((animal) => {
                      const data = dayData[animal.id];
                      if (!data) {
                        return (
                          <td key={animal.id} className="px-2 md:px-3 py-2 md:py-3 text-center text-muted-foreground">
                            -
                          </td>
                        );
                      }
                      return (
                        <td key={animal.id} className="px-2 md:px-3 py-2 md:py-3 text-center">
                          <div>
                            <div className="text-muted-foreground text-[10px] md:text-xs">({data.weight_lb.toFixed(1)})</div>
                            <div className="font-semibold text-primary text-xs md:text-sm">{data.total_liters.toFixed(1)}L</div>
                          </div>
                        </td>
                      );
                    })}
                    <td className="sticky right-0 bg-background z-10 px-2 md:px-4 py-2 md:py-3 text-center border-l">
                      <div className="font-semibold text-[10px] md:text-sm">{dayTotal.toFixed(1)}L</div>
                      <div className="text-[9px] md:text-xs text-muted-foreground whitespace-nowrap">{formatCurrency(dayRevenue)}</div>
                    </td>
                  </tr>
                );
              })}
              {/* Totals Row */}
              <tr className="bg-primary/5 font-bold border-t-2">
                <td className="sticky left-0 bg-primary/5 z-10 px-2 md:px-4 py-2 md:py-3 text-[10px] md:text-sm">
                  {t('reports.total')}
                </td>
                {visibleAnimals?.map((animal) => {
                  const totals = animalTotals[animal.id];
                  return (
                    <td key={animal.id} className="px-2 md:px-3 py-2 md:py-3 text-center">
                      <div className="font-bold text-primary text-xs md:text-sm">{totals.liters.toFixed(1)}L</div>
                      <div className="text-[9px] md:text-xs text-muted-foreground whitespace-nowrap">{formatCurrency(totals.revenue)}</div>
                    </td>
                  );
                })}
                <td className="sticky right-0 bg-primary/5 z-10 px-2 md:px-4 py-2 md:py-3 text-center border-l">
                  <div className="font-bold text-xs md:text-sm">{reportData.summary.total_liters_produced.toFixed(1)}L</div>
                  <div className="text-[9px] md:text-xs text-muted-foreground whitespace-nowrap">{formatCurrency(reportData.summary.total_liters_produced * (tenantSettings?.default_price_per_l || 1))}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
