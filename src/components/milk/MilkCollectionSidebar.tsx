import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Truck, ChevronLeft, ChevronRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import { useTenantSettings } from "@/hooks/useTenantSettings";
import { useEffect, useMemo, useState } from "react";
import type { AnimalResponse } from "@/services/types";
import { getPref, setPref } from "@/utils/prefs";

interface RecentEntry {
  animal: string;
  amount: string;
  time: string;
}

interface RecentDelivery {
  buyer: string;
  amount: string;
  time: string;
}

interface Production {
  animal_id?: string;
  date_time: string;
  shift: string;
  volume_l: string;
}

interface MilkCollectionSidebarProps {
  activeTab: string;
  recentEntries: RecentEntry[];
  recentDeliveries: RecentDelivery[];
  productions: Production[];
  animals?: Pick<AnimalResponse, 'id' | 'name' | 'tag'>[];
  formData: {
    date: string;
    shift: string;
  };
  effectivePrice?: number;
}

export default function MilkCollectionSidebar({
  activeTab,
  recentEntries,
  recentDeliveries,
  productions,
  animals = [],
  formData,
  effectivePrice
}: MilkCollectionSidebarProps) {
  const { t } = useTranslation();
  const { data: tenantSettings } = useTenantSettings();
  const [pageSize, setPageSize] = useState<number>(() => getPref<number>('prefs:milk:daily:pageSize', 10, { session: true }));
  const [page, setPage] = useState<number>(() => getPref<number>('prefs:milk:daily:page', 0, { session: true }));
  const [search, setSearch] = useState<string>(() => getPref<string>('prefs:milk:daily:search', '', { session: true }));

  // Persist pagination in session
  useEffect(() => { setPref('prefs:milk:daily:pageSize', pageSize, { session: true }); }, [pageSize]);
  useEffect(() => { setPref('prefs:milk:daily:page', page, { session: true }); }, [page]);
  useEffect(() => { setPref('prefs:milk:daily:search', search, { session: true }); }, [search]);

  // Calculate daily statistics (both shifts)
  const dailyProductions = productions.filter((p) =>
    new Date(p.date_time).toISOString().startsWith(formData.date)
  );

  const amProductions = dailyProductions.filter((p) =>
    p.shift === 'AM'
  );

  const pmProductions = dailyProductions.filter((p) =>
    p.shift === 'PM'
  );

  const dailyStats = {
    // AM shift stats
    amCount: amProductions.length,
    amLiters: amProductions.reduce((sum, p) => sum + parseFloat(p.volume_l), 0),

    // PM shift stats
    pmCount: pmProductions.length,
    pmLiters: pmProductions.reduce((sum, p) => sum + parseFloat(p.volume_l), 0),

    // Daily totals
    totalAnimals: dailyProductions.length,
    totalLiters: dailyProductions.reduce((sum, p) => sum + parseFloat(p.volume_l), 0),
    averagePerAnimal: dailyProductions.length > 0
      ? dailyProductions.reduce((sum, p) => sum + parseFloat(p.volume_l), 0) / dailyProductions.length
      : 0,
  };

  const formatCurrency = (amount: number): string => {
    const currency = tenantSettings?.default_currency || 'USD';
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(amount);
  };

  const priceFor = (p: Production) => {
    const snap = (p as any).price_snapshot;
    const parsed = snap ? parseFloat(String(snap)) : undefined;
    return parsed ?? effectivePrice ?? 0;
  };

  const totalAmount = dailyProductions.reduce((sum, p) => sum + parseFloat(p.volume_l) * priceFor(p), 0);

  const sortedDaily = useMemo(() => (
    dailyProductions
      .slice()
      .sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime())
  ), [dailyProductions]);

  const filteredDaily = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return sortedDaily;
    return sortedDaily.filter((p) => {
      const a = animals.find(an => (an as any).id === (p as any).animal_id);
      const name = (a?.name ?? '').toLowerCase();
      const tag = (a?.tag ?? '').toLowerCase();
      return name.includes(term) || tag.includes(term);
    });
  }, [sortedDaily, search, animals]);

  const total = filteredDaily.length;
  const start = total === 0 ? 0 : (page * pageSize) + 1;
  const end = Math.min((page + 1) * pageSize, total);
  const pageItems = filteredDaily.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className="space-y-6">

      {activeTab === "production" && (
        <Card>
          <CardHeader>
            <CardTitle>{t("milk.dailySummary")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* AM Shift */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">{t("milk.morning")}</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>{t("milk.milkedAnimals")}</span>
                    <span className="font-medium">{dailyStats.amCount}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>{t("milk.totalLiters")}</span>
                    <span className="font-medium">{dailyStats.amLiters.toFixed(1)}L</span>
                  </div>
                </div>
              </div>

              {/* PM Shift */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">{t("milk.evening")}</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>{t("milk.milkedAnimals")}</span>
                    <span className="font-medium">{dailyStats.pmCount}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>{t("milk.totalLiters")}</span>
                    <span className="font-medium">{dailyStats.pmLiters.toFixed(1)}L</span>
                  </div>
                </div>
              </div>

              {/* Daily Totals */}
                <div className="pt-2 border-t">
                  <h4 className="text-sm font-medium mb-2">{t("milk.dailyTotal")}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{t("milk.totalAnimals")}</span>
                      <span className="font-medium">{dailyStats.totalAnimals}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{t("milk.totalLiters")}</span>
                      <span className="font-medium">{dailyStats.totalLiters.toFixed(1)}L</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{t("milk.totalAmount")}</span>
                      <span className="font-medium">{formatCurrency(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{t("milk.averageAnimal")}</span>
                      <span className="font-medium">{dailyStats.averagePerAnimal.toFixed(1)}L</span>
                    </div>
                  </div>
                </div>
              </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "production" && (
        <Card>
          <CardHeader>
            {/* 1) Título */}
            <CardTitle>{t("milk.dailyRecords")}</CardTitle>
            {/* 2) Buscador */}
            <div className="mt-2">
              <Input
                placeholder={t('animals.searchPlaceholder') ?? 'Buscar animal/código'}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="h-9"
              />
            </div>
            {/* 3) Controles de paginación */}
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">{t('milk.perPage')}</span>
                <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(parseInt(v, 10)); setPage(0); }}>
                  <SelectTrigger className="w-[84px]">
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="30">30</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((p) => ((p + 1) * pageSize < total ? p + 1 : p))} disabled={(page + 1) * pageSize >= total}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {total > 0 ? (
              <>
                {/* Condensed list (fits sidebar width on large screens) */}
                <div className="space-y-3">
                  {pageItems.map((p, idx) => {
                    const liters = parseFloat(p.volume_l);
                    const pounds = liters * 2.20462;
                    const price = priceFor(p);
                    const amount = liters * price;
                    const shift = (p.shift || 'AM') as string;
                    const animal = animals.find(a => (a as any).id === (p as any).animal_id);
                    const animalLabel = animal ? `${animal.name ?? ''} (${animal.tag ?? ''})`.trim() : '-';
                  return (
                    <div key={idx} className="border border-border rounded-lg p-4 bg-card hover:bg-accent/10 transition-colors">
                      {/* Nombre en primeras dos filas (clamp a 2 líneas) */}
                      <div
                        className="font-medium leading-snug line-clamp-2"
                        title={animalLabel}
                      >
                        {animalLabel}
                      </div>
                      {/* Controles y monto */}
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <Badge variant={shift === 'AM' ? 'default' : 'secondary'} className="shrink-0">{shift}</Badge>
                        <div className="text-right font-medium font-mono whitespace-nowrap">{formatCurrency(amount)}</div>
                      </div>
                      {/* Métricas */}
                      <div className="mt-2 grid grid-cols-2 text-sm">
                        <span className="text-muted-foreground">{t('milk.pounds')}: <span className="font-medium">{pounds.toFixed(1)} lb</span></span>
                        <span className="text-right text-muted-foreground">{t('milk.liters')}: <span className="font-medium">{liters.toFixed(1)} L</span></span>
                      </div>
                    </div>
                  );
                  })}
                </div>
                <div className="mt-3 text-xs text-muted-foreground text-right">
                  {start}-{end} / {total}
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">{t('common.noRecordsForDate')}</p>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "delivery" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t("milk.recentDeliveries")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentDeliveries.map((delivery, index) => (
                <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-accent/20">
                  <div>
                    <p className="font-medium text-sm">{delivery.buyer}</p>
                    <p className="text-xs text-muted-foreground">{delivery.time}</p>
                  </div>
                  <Badge variant="secondary">{delivery.amount}</Badge>
                </div>
              ))}
              {recentDeliveries.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <Truck className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p className="text-xs">{t("common.noDeliveriesForDate")}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
