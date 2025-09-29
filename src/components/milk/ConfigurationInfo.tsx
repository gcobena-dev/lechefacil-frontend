import { Info } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export default function ConfigurationInfo() {
  const { t } = useTranslation();

  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg">
      <div className="flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
        <div>
          <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-1">{t("milk.configuration")}</p>
          <div className="text-xs text-blue-700 dark:text-blue-300">
            <p className="mb-1">{t("milk.configurationChangeUnit")} <strong>{t("milk.configurationMyProfile")}</strong></p>
            <p>{t("milk.configurationChangePrices")} <strong>{t("milk.milkPricesTitle")}</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
}