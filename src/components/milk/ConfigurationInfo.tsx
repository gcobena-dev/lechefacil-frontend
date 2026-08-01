import { Info } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";

export default function ConfigurationInfo() {
  const { t } = useTranslation();

  return (
    <div className="p-4 border border-info/20 bg-info/10 rounded-lg">
      <div className="flex items-start gap-3">
        <Info className="h-5 w-5 text-info mt-0.5" />
        <div>
          <p className="text-sm text-foreground font-medium mb-1">{t("milk.configuration")}</p>
          <div className="text-xs text-muted-foreground">
            <p className="mb-1">
              {t("milk.configurationChangeUnit")}{" "}
              <Link
                to="/settings?tab=tenant"
                className="underline hover:text-info font-medium"
              >
                {t("milk.configurationMyProfile")}
              </Link>
            </p>
            <p>
              {t("milk.configurationChangePrices")}{" "}
              <Link
                to="/settings?tab=prices"
                className="underline hover:text-info font-medium"
              >
                {t("milk.configurationChangePricesLink")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}