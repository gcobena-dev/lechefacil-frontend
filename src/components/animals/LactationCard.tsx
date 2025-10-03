import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Droplets, TrendingUp, Clock } from "lucide-react";
import { formatDate } from "@/utils/format";
import {
  type Lactation,
  getLactationStatusLabel,
  getLactationStatusColor,
} from "@/services/lactations";
import { useTranslation } from "@/hooks/useTranslation";

interface LactationCardProps {
  lactation: Lactation;
}

export default function LactationCard({ lactation }: LactationCardProps) {
  const { t } = useTranslation();
  const formatNumber = (num: number | undefined) => {
    if (num === undefined || num === null) return '-';
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(num);
  };

  const isOpen = lactation.status === 'open';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-xl">
            {t('animals.lactation')} #{lactation.number}
          </CardTitle>
          <Badge className={getLactationStatusColor(lactation.status)} variant="secondary">
            {isOpen ? '🟢' : '⚪'} {t(getLactationStatusLabel(lactation.status))}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Dates */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{t('animals.start')}:</span>
          <span className="font-medium">{formatDate(lactation.start_date)}</span>
        </div>

        {lactation.end_date && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{t('animals.end')}:</span>
            <span className="font-medium">{formatDate(lactation.end_date)}</span>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-3 pt-2 border-t">
          {/* Days in Milk */}
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{t('animals.daysInMilk')}</p>
            </div>
            <p className="text-lg font-semibold">
              {lactation.days_in_milk !== undefined ? lactation.days_in_milk : '-'}
            </p>
          </div>

          {/* Total Volume */}
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Droplets className="h-3 w-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{t('animals.total')}</p>
            </div>
            <p className="text-lg font-semibold">
              {formatNumber(lactation.total_volume_l)} L
            </p>
          </div>

          {/* Average Daily */}
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{t('animals.average')}</p>
            </div>
            <p className="text-lg font-semibold">
              {formatNumber(lactation.average_daily_l)} {t('animals.litersPerDay')}
            </p>
          </div>
        </div>

        {/* Production Count */}
        {lactation.production_count !== undefined && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            {lactation.production_count} {t('animals.productionRecords')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
