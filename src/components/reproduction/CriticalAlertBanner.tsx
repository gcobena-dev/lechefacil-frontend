import { AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

interface Props {
  criticalCount: number;
  warningCount: number;
  onReview: () => void;
}

export default function CriticalAlertBanner({ criticalCount, warningCount, onReview }: Props) {
  const { t } = useTranslation();
  if (criticalCount === 0) return null;

  return (
    <div className="rounded-lg border border-destructive/40 bg-destructive/5 dark:bg-destructive/10 p-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="rounded-md bg-destructive/15 p-2 shrink-0">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm">
            <span className="text-destructive font-semibold text-base">{criticalCount}</span>{" "}
            <span className="font-medium">{t("reproduction.criticalCowsBanner")}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {t("reproduction.criticalCowsHint")}
            {warningCount > 0 && (
              <>
                {" · "}
                <span>
                  {warningCount} {t("reproduction.moderateAlertSuffix")}
                </span>
              </>
            )}
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onReview}
        className="w-full sm:w-auto sm:shrink-0"
      >
        {t("reproduction.reviewNow")}
        <ArrowRight className="ml-2 h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
