import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Truck } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

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
}

export default function MilkCollectionSidebar({
  activeTab,
  recentEntries,
  recentDeliveries,
  productions,
  formData
}: MilkCollectionSidebarProps) {
  const { t } = useTranslation();

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
      : 0
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t("milk.lastRecords")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentEntries.map((entry, index) => (
              <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-accent/20">
                <div>
                  <p className="font-medium text-sm">{entry.animal}</p>
                  <p className="text-xs text-muted-foreground">{entry.time}</p>
                </div>
                <Badge variant="secondary">{entry.amount}</Badge>
              </div>
            ))}
            {recentEntries.length === 0 && (
              <p className="text-xs text-muted-foreground">{t("common.noRecordsForDate")}</p>
            )}
          </div>
        </CardContent>
      </Card>

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
                    <span className="text-sm text-muted-foreground">{t("milk.averageAnimal")}</span>
                    <span className="font-medium">{dailyStats.averagePerAnimal.toFixed(1)}L</span>
                  </div>
                </div>
              </div>
            </div>
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