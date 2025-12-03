import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ProductionReportData } from "@/services/reports";
import { useTenantSettings } from "@/hooks/useTenantSettings";
import { useTranslation } from "@/hooks/useTranslation";
import { getAnimalImageUrl } from "@/utils/animals";
import { Link } from "react-router-dom";

interface DailyDetailReportProps {
  reportData: ProductionReportData;
}

export default function DailyDetailReport({ reportData }: DailyDetailReportProps) {
  const { t, i18n } = useTranslation();
  const { data: tenantSettings } = useTenantSettings();
  const [animalPage, setAnimalPage] = useState(0);
  const [animalsPerPage, setAnimalsPerPage] = useState(2);
  const [mobileCards, setMobileCards] = useState(false);
  const [expandedDateKey, setExpandedDateKey] = useState<string | null>(null);

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
  // Use report period year (or current year). Avoid Date parsing of YYYY-MM-DD to prevent platform quirks.
  const getReportYear = () => {
    const pf = reportData?.summary?.period_from;
    if (typeof pf === 'string') {
      const m = pf.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (m) return parseInt(m[1], 10);
    }
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
  // For cards view, we want most recent first (desc)
  const datesDesc = [...dates].sort((a, b) => parseDateKey(b).getTime() - parseDateKey(a).getTime());
  // Ensure there is a default expanded card when switching to cards mode
  useEffect(() => {
    if (mobileCards) {
      // Default to the latest date (end of period)
      const last = dates[dates.length - 1];
      setExpandedDateKey((prev) => prev ?? last ?? null);
    }
  }, [mobileCards, dates.join('|')]);

  // Paginate animals (table mode only)
  const totalAnimals = reportData.animals?.length || 0;
  const totalPages = Math.ceil(totalAnimals / animalsPerPage);
  const startIndex = animalPage * animalsPerPage;
  const endIndex = startIndex + animalsPerPage;
  const visibleAnimals = reportData.animals?.slice(startIndex, endIndex) || [];
  const allAnimals = reportData.animals || [];

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

  const photoByAnimalId = useMemo(() => {
    const map = new Map<string, string>();
    (reportData.animals ?? []).forEach((a) => {
      const url = getAnimalImageUrl(a as any) ?? "/logo.png";
      map.set(a.id, url);
    });
    return map;
  }, [reportData.animals]);

  // Format date helper
  const formatDate = (dateKey: string) => {
    const date = parseDateKey(dateKey);
    const day = String(date.getDate());
    const weekday = date.toLocaleDateString(i18n.language || 'es-EC', { weekday: 'short' });
    const monthShort = date.toLocaleDateString(i18n.language || 'es-EC', { month: 'short' });
    return `${weekday} ${day}/${monthShort}`;
  };

  return (
    <Card>
      <CardContent className="p-0">
        {/* Mobile view toggle */}
        <div className="px-3 py-2 border-b md:hidden flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{t('reports.viewMode') ?? 'Modo de vista'}</span>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              className="rounded border-input"
              checked={mobileCards}
              onChange={(e) => setMobileCards(e.target.checked)}
            />
            {mobileCards ? (t('reports.cards') ?? 'Tarjetas') : (t('reports.table') ?? 'Tabla')}
          </label>
        </div>
        {/* Cards mode on mobile */}
        {mobileCards && (
          <div className="md:hidden p-3 space-y-3">
            {/* Totals across dates per all animals (collapsible, default collapsed) */}
            <div className="border-2 border-primary rounded-lg bg-muted/50">
              <button
                type="button"
                className="w-full p-3 flex items-center justify-between"
                onClick={() => setExpandedDateKey((prev) => (prev === 'TOTALS' ? null : 'TOTALS'))}
              >
                <div className="font-bold text-sm">{t('reports.total')}</div>
                <div className="text-right text-xs text-muted-foreground">
                  {/* Show overall summary numbers in header for quick glance */}
                  <div className="font-semibold text-primary">{reportData.summary.total_liters_produced.toFixed(1)}L</div>
                  <div className="text-[10px]">{formatCurrency(reportData.summary.total_liters_produced * (tenantSettings?.default_price_per_l || 1))}</div>
                </div>
              </button>
              {expandedDateKey === 'TOTALS' && (
                <div className="p-3 pt-0">
                  <div className="space-y-2 text-xs">
                    {allAnimals.map((animal) => {
                      const totals = animalTotals[animal.id];
                      const photoUrl = photoByAnimalId.get(animal.id) ?? "/logo.png";
                      return (
                        <Link
                          to={`/animals/${animal.id}`}
                          key={animal.id}
                          className="flex items-center justify-between gap-3 hover:bg-accent/40 rounded-md px-2 py-1"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="h-8 w-8 rounded-full overflow-hidden bg-muted border border-border shrink-0">
                              <img src={photoUrl} alt={animal.tag} className="h-full w-full object-cover" loading="lazy" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold truncate leading-tight">{animal.tag}</div>
                              {animal.name && (
                                <div className="text-[10px] text-muted-foreground leading-tight line-clamp-2 break-words min-h-[20px]">{animal.name}</div>
                              )}
                            </div>
                          </div>
                          <div className="text-right self-center">
                            <div className="font-bold text-primary">{totals.liters.toFixed(1)}L</div>
                            <div className="text-[10px] text-muted-foreground">{formatCurrency(totals.revenue)}</div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  <div className="mt-2 pt-2 border-t flex items-center justify-between text-xs">
                    <span>{t('reports.totalOverall') ?? 'Total general'}</span>
                    <div className="text-right">
                      <div className="font-bold">{reportData.summary.total_liters_produced.toFixed(1)}L</div>
                      <div className="text-[10px] text-muted-foreground">{formatCurrency(reportData.summary.total_liters_produced * (tenantSettings?.default_price_per_l || 1))}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {datesDesc.map((dateKey) => {
              const dayData = daily[dateKey];
              const dayTotal = Object.values(dayData).reduce((sum, d: any) => sum + d.total_liters, 0);
              const dayRevenue = dayTotal * (tenantSettings?.default_price_per_l || 1);
              return (
                <div key={dateKey} className="border border-border rounded-lg bg-card">
                  <button
                    type="button"
                    className="w-full p-3 flex items-baseline justify-between"
                    onClick={() => setExpandedDateKey((prev) => (prev === dateKey ? null : dateKey))}
                  >
                    <div className="font-medium text-sm text-left">{formatDate(dateKey)}</div>
                    <div className="text-right">
                      <div className="font-semibold text-primary text-sm">{dayTotal.toFixed(1)}L</div>
                      <div className="text-[10px] text-muted-foreground">{formatCurrency(dayRevenue)}</div>
                    </div>
                  </button>
                  {expandedDateKey === dateKey && (
                    <div className="p-3 pt-0 space-y-2">
                      {allAnimals
                        .filter((animal) => !!dayData[animal.id])
                        .map((animal) => {
                          const data: any = dayData[animal.id];
                          const photoUrl = photoByAnimalId.get(animal.id) ?? "/logo.png";
                          return (
                            <Link
                              to={`/animals/${animal.id}`}
                              key={animal.id}
                              className="flex items-center justify-between text-xs hover:bg-accent/40 rounded-md px-2 py-1"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="h-8 w-8 rounded-full overflow-hidden bg-muted border border-border shrink-0">
                                  <img src={photoUrl} alt={animal.tag} className="h-full w-full object-cover" loading="lazy" />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-semibold truncate max-w-[140px] leading-tight">{animal.tag}</div>
                                  {animal.name && (
                                    <div className="text-[10px] text-muted-foreground leading-tight line-clamp-2 break-words max-w-[140px] min-h-[20px]">{animal.name}</div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right self-center">
                                <div className="text-muted-foreground">({Number(data.weight_lb).toFixed(1)})</div>
                                <div className="font-semibold text-primary">{Number(data.total_liters).toFixed(1)}L</div>
                              </div>
                            </Link>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {/* Table mode (default): keep controls and table together so only content switches */}
        {!mobileCards && (
          <>
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
                  disabled={animalPage === 0 || totalPages <= 1}
                  className="h-7 w-7 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground">
                  {totalPages > 0 ? `${animalPage + 1}/${totalPages}` : '0/0'}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAnimalPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={animalPage >= totalPages - 1 || totalPages <= 1}
                  className="h-7 w-7 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              </div>
            <div className={`overflow-x-auto`}>
              <table className="text-xs md:text-sm md:w-full" style={{ minWidth: '100%' }}>
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="sticky left-0 bg-muted/50 z-10 px-2 md:px-4 py-2 md:py-3 text-left font-semibold w-[80px] md:w-[120px]">
                  {t('reports.dateLabel')}
                </th>
                {visibleAnimals?.map((animal) => {
                  const photoUrl = photoByAnimalId.get(animal.id) ?? "/logo.png";
                  return (
                    <th key={animal.id} className="px-2 md:px-3 py-2 md:py-3 text-center font-semibold w-[90px] md:w-[120px] align-top">
                      <Link to={`/animals/${animal.id}`} className="flex flex-col items-center gap-1 hover:text-primary">
                        <div className="h-10 w-10 rounded-full overflow-hidden bg-muted border border-border">
                          <img src={photoUrl} alt={animal.tag} className="h-full w-full object-cover" loading="lazy" />
                        </div>
                        <div className="font-semibold truncate w-full leading-tight">{animal.tag}</div>
                        <div className="text-[9px] md:text-xs text-muted-foreground font-normal leading-tight line-clamp-2 break-words w-full min-h-[24px] text-center">
                          {animal.name || "\u00A0"}
                        </div>
                      </Link>
                    </th>
                  );
                })}
                <th className="sticky right-0 bg-muted/50 z-10 px-2 md:px-4 py-2 md:py-3 text-center font-semibold w-[70px] md:w-[140px] border-l">
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
          </>
        )}
      </CardContent>
    </Card>
  );
}
