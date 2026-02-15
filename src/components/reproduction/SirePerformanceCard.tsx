import { useTranslation } from "@/hooks/useTranslation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SirePerformanceResponse } from "@/services/sireCatalog";

interface SirePerformanceCardProps {
  performance: SirePerformanceResponse;
}

export function SirePerformanceCard({ performance }: SirePerformanceCardProps) {
  const { t } = useTranslation();
  const rate = (performance.conception_rate * 100).toFixed(1);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          {t("reproduction.sirePerformance")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">
              {performance.total_inseminations}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("reproduction.totalInseminations")}
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              {performance.confirmed_pregnancies}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("reproduction.confirmedPregnancies")}
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold">{rate}%</p>
            <p className="text-xs text-muted-foreground">
              {t("reproduction.conceptionRate")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
