import { useTranslation } from "@/hooks/useTranslation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { InseminationResponse } from "@/services/inseminations";

interface InseminationCardProps {
  insemination: InseminationResponse;
  animalTag?: string;
  sireName?: string;
  onClick?: () => void;
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  CONFIRMED: "default",
  OPEN: "outline",
  LOST: "destructive",
};

export function InseminationCard({
  insemination,
  animalTag,
  sireName,
  onClick,
}: InseminationCardProps) {
  const { t } = useTranslation();

  const statusKey = insemination.pregnancy_status.toLowerCase();
  const statusLabel = t(`reproduction.${statusKey}`);
  const methodLabel = t(`reproduction.method${insemination.method}`);
  const daysSince = Math.floor(
    (Date.now() - new Date(insemination.service_date).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            {animalTag && (
              <p className="font-semibold text-sm">{animalTag}</p>
            )}
            <p className="text-sm text-muted-foreground">
              {new Date(insemination.service_date).toLocaleDateString()}
              {" - "}
              {methodLabel}
            </p>
            {sireName && (
              <p className="text-sm text-muted-foreground">
                {t("reproduction.selectSire")}: {sireName}
              </p>
            )}
            {insemination.technician && (
              <p className="text-xs text-muted-foreground">
                {t("reproduction.technician")}: {insemination.technician}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant={STATUS_VARIANTS[insemination.pregnancy_status] || "secondary"}>
              {statusLabel}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {daysSince} {t("reproduction.daysSinceService").toLowerCase()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
