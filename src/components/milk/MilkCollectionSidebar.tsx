import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Truck, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import { useTenantSettings } from "@/hooks/useTenantSettings";
import { getLocalDateString as toLocalDate } from "@/utils/dateUtils";
import { useEffect, useMemo, useState } from "react";
import type { AnimalResponse } from "@/services/types";
import { getPref, setPref } from "@/utils/prefs";
import { getAnimalImageUrl } from "@/utils/animals";
import { useNavigate } from "react-router-dom";

interface RecentEntry {
  animal: string;
  amount: string;
  time: string;
}

interface RecentDelivery {
  buyer: string;
  volume: string;
  amountValue?: number;
  currency?: string;
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
  productionsOrder?: {
    order_by: 'recent' | 'volume' | 'name' | 'code';
    order: 'asc' | 'desc';
    setOrderBy: (v: 'recent' | 'volume' | 'name' | 'code') => void;
    setOrder: (v: 'asc' | 'desc') => void;
  };
}

export default function MilkCollectionSidebar({
  activeTab,
  recentEntries,
  recentDeliveries,
  productions,
  animals = [],
  formData,
  effectivePrice,
  productionsOrder
}: MilkCollectionSidebarProps) {
  const { t } = useTranslation();
  const { data: tenantSettings } = useTenantSettings();
  const navigate = useNavigate();
  const [pageSize, setPageSize] = useState<number>(() => getPref<number>('prefs:milk:daily:pageSize', 10, { session: true }));
  const [page, setPage] = useState<number>(() => getPref<number>('prefs:milk:daily:page', 0, { session: true }));
  const [search, setSearch] = useState<string>(() => getPref<string>('prefs:milk:daily:search', '', { session: true }));

  // Persist pagination in session
  useEffect(() => { setPref('prefs:milk:daily:pageSize', pageSize, { session: true }); }, [pageSize]);
  useEffect(() => { setPref('prefs:milk:daily:page', page, { session: true }); }, [page]);
  useEffect(() => { setPref('prefs:milk:daily:search', search, { session: true }); }, [search]);

  // Calculate daily statistics (both shifts) using LOCAL date comparison
  const dailyProductions = productions.filter((p) => {
    const localDate = toLocalDate(new Date(p.date_time));
    return localDate === formData.date;
  });

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

  const formatCurrency = (amount: number, currencyOverride?: string): string => {
    const currency = currencyOverride || tenantSettings?.default_currency || 'USD';
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(amount);
  };

  const priceFor = (p: Production) => {
    const snap = (p as any).price_snapshot;
    const parsed = snap ? parseFloat(String(snap)) : undefined;
    return parsed ?? effectivePrice ?? 0;
  };

  const totalAmount = dailyProductions.reduce((sum, p) => sum + parseFloat(p.volume_l) * priceFor(p), 0);

  const sortedDaily = useMemo(() => {
    const ob = productionsOrder?.order_by || 'recent';
    const od = productionsOrder?.order || 'desc';
    const dir = od === 'asc' ? 1 : -1;
    return dailyProductions
      .slice()
      .sort((a, b) => {
        if (ob === 'volume') {
          const va = parseFloat(a.volume_l);
          const vb = parseFloat(b.volume_l);
          return (va - vb) * dir;
        }
        if (ob === 'name') {
          const aa = animals.find(an => (an as any).id === (a as any).animal_id);
          const ab = animals.find(an => (an as any).id === (b as any).animal_id);
          const na = (aa?.name || aa?.tag || '').toString().toLowerCase();
          const nb = (ab?.name || ab?.tag || '').toString().toLowerCase();
          return na.localeCompare(nb) * dir;
        }
        if (ob === 'code') {
          const aa = animals.find(an => (an as any).id === (a as any).animal_id);
          const ab = animals.find(an => (an as any).id === (b as any).animal_id);
          const ta = (aa?.tag || '').toString().toLowerCase();
          const tb = (ab?.tag || '').toString().toLowerCase();
          return ta.localeCompare(tb) * dir;
        }
        // recent
        return (new Date(a.date_time).getTime() - new Date(b.date_time).getTime()) * dir;
      });
  }, [dailyProductions, animals, productionsOrder?.order_by, productionsOrder?.order]);

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
            {/* 2) Buscador + Orden (siempre en líneas separadas) */}
            <div className="mt-2 flex flex-col gap-2">
              <Input
                placeholder={t('animals.searchPlaceholder') ?? 'Buscar animal/código'}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="h-9 w-full md:flex-1"
              />
              <div className="mt-2 md:mt-0 flex items-center gap-2 md:ml-auto">
                <span className="text-sm text-muted-foreground whitespace-nowrap">{t('milk.sortBy')}</span>
                <Select
                  value={productionsOrder?.order_by || 'recent'}
                  onValueChange={(v) => {
                    const ob = (v as 'recent' | 'volume' | 'name' | 'code');
                    productionsOrder?.setOrderBy(ob);
                    // Defaults: recent/volume -> desc, name -> asc
                    if (ob === 'name' || ob === 'code') productionsOrder?.setOrder('asc');
                    else productionsOrder?.setOrder('desc');
                    setPage(0);
                  }}
                >
                  <SelectTrigger className="h-9 w-full md:w-[220px] lg:w-[260px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">{t('milk.mostRecent')}</SelectItem>
                    <SelectItem value="volume">{t('milk.byProduction')}</SelectItem>
                    <SelectItem value="name">{t('milk.byName')}</SelectItem>
                    <SelectItem value="code">{t('milk.byCode')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                  const photoUrl = getAnimalImageUrl(animal) ?? "/logo.png";
                return (
                    <div
                      key={idx}
                      className="border border-border rounded-lg p-4 bg-card hover:bg-accent/10 transition-colors cursor-pointer"
                      onClick={() => {
                        if (animal?.id) navigate(`/animals/${animal.id}`);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-md bg-muted overflow-hidden border border-border shrink-0">
                          <img
                            src={photoUrl}
                            alt={animalLabel || "Animal"}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        {/* Nombre en primeras dos filas (clamp a 2 líneas) */}
                        <div
                          className="font-medium leading-snug line-clamp-2"
                          title={animalLabel}
                        >
                          {animalLabel}
                        </div>
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
                <div key={index} className="p-3 rounded-lg bg-accent/20 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-sm break-words flex-1 min-w-0">{delivery.buyer}</p>
                    <Badge variant="outline" className="shrink-0">
                      {delivery.volume}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground flex-1 min-w-0">{delivery.time}</p>
                    {delivery.amountValue !== undefined ? (
                      <Badge variant="secondary" className="shrink-0">
                        {formatCurrency(delivery.amountValue, delivery.currency)}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="shrink-0">{delivery.volume}</Badge>
                    )}
                  </div>
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
