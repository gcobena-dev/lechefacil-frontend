import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface WithdrawalAlertProps {
  withdrawalUntil: string;
  animalName?: string;
}

export default function WithdrawalAlert({
  withdrawalUntil,
  animalName,
}: WithdrawalAlertProps) {
  const { t } = useTranslation();
  const calculateDaysRemaining = (dateString: string) => {
    const targetDate = new Date(dateString);
    const today = new Date();
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const daysRemaining = calculateDaysRemaining(withdrawalUntil);

  return (
    <Alert variant="destructive" className="mb-4 border-2">
      <AlertCircle className="h-5 w-5" />
      <AlertTitle className="text-lg font-bold">
        ⚠️ {t("health.withdrawalAlert")}
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-1">
        <p className="font-semibold text-base">
          {t("health.doNotMilk")} {animalName || t("health.thisAnimal")} {t("health.until")}:{" "}
          {formatDate(withdrawalUntil)}
        </p>
        <p className="text-sm">
          ⏳ {t("health.daysRemaining")}:{" "}
          <span className="font-semibold">
            {daysRemaining} {daysRemaining === 1 ? t("health.day") : t("health.days")}
          </span>
        </p>
      </AlertDescription>
    </Alert>
  );
}
