import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Truck, ChevronLeft, ChevronRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/hooks/useTranslation";
import { useTenantSettings } from "@/hooks/useTenantSettings";
import { useMemo, useState } from "react";

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
  date_time: string;
  shift: string;
  volume_l: string;
}

interface MilkCollectionSidebarProps {
  activeTab: string;
  recentEntries: RecentEntry[];
  recentDeliveries: RecentDelivery[];
  productions: Production[];
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
  formData,
  effectivePrice
}: MilkCollectionSidebarProps) {
  const { t } = useTranslation();
  const { data: tenantSettings } = useTenantSettings();
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(0);

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

  const total = sortedDaily.length;
  const start = total === 0 ? 0 : (page * pageSize) + 1;
  const end = Math.min((page + 1) * pageSize, total);
  const pageItems = sortedDaily.slice(page * pageSize, (page + 1) * pageSize);

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
            <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="shrink-0">{t("milk.dailyRecords")}</span>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm hidden sm:inline">{t('milk.perPage')}</span>
                <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(parseInt(v, 10)); setPage(0); }}>
                  <SelectTrigger className="w-[84px] sm:w-[90px]">
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="30">30</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 sm:ml-2">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((p) => ((p + 1) * pageSize < total ? p + 1 : p))} disabled={(page + 1) * pageSize >= total}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {total > 0 ? (
              <>
                {/* Desktop table */}
                <div className="hidden md:block">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('milk.shift')}</TableHead>
                          <TableHead>{t('milk.pounds')}</TableHead>
                          <TableHead>{t('milk.liters')}</TableHead>
                          <TableHead className="text-right">{t('milk.amount')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pageItems.map((p, idx) => {
                          const liters = parseFloat(p.volume_l);
                          const pounds = liters * 2.20462;
                          const price = priceFor(p);
                          const amount = liters * price;
                          const shift = (p.shift || 'AM') as string;
                          return (
                            <TableRow key={idx}>
                              <TableCell>
                                <Badge variant={shift === 'AM' ? 'default' : 'secondary'}>
                                  {shift}
                                </Badge>
                              </TableCell>
                              <TableCell>{pounds.toFixed(1)} lb</TableCell>
                              <TableCell>{liters.toFixed(1)} L</TableCell>
                              <TableCell className="text-right font-medium">{formatCurrency(amount)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                {/* Mobile list */}
                <div className="md:hidden space-y-3">
                  {pageItems.map((p, idx) => {
                    const liters = parseFloat(p.volume_l);
                    const pounds = liters * 2.20462;
                    const price = priceFor(p);
                    const amount = liters * price;
                    const shift = (p.shift || 'AM') as string;
                    return (
                      <div key={idx} className="border border-border rounded-lg p-4 bg-card">
                        <div className="flex justify-between items-start">
                          <Badge variant={shift === 'AM' ? 'default' : 'secondary'}>{shift}</Badge>
                          <div className="text-right font-medium">{formatCurrency(amount)}</div>
                        </div>
                        <div className="mt-2 flex justify-between text-sm">
                          <span>{t('milk.pounds')}: {pounds.toFixed(1)} lb</span>
                          <span>{t('milk.liters')}: {liters.toFixed(1)} L</span>
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
