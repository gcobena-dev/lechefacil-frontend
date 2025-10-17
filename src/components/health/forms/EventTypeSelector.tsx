import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";

interface EventTypeSelectorProps {
  onSelect: (type: "VACCINATION" | "TREATMENT" | "VET_OBSERVATION" | "EMERGENCY") => void;
}

export default function EventTypeSelector({ onSelect }: EventTypeSelectorProps) {
  const { t } = useTranslation();

  const eventTypes = [
    {
      id: "VACCINATION" as const,
      icon: "💉",
      label: t("health.vaccinationLabel"),
      description: t("health.vaccinationDescription"),
    },
    {
      id: "TREATMENT" as const,
      icon: "💊",
      label: t("health.treatmentLabel"),
      description: t("health.treatmentDescription"),
    },
    {
      id: "VET_OBSERVATION" as const,
      icon: "🩺",
      label: t("health.observationLabel"),
      description: t("health.observationDescription"),
    },
    {
      id: "EMERGENCY" as const,
      icon: "🚑",
      label: t("health.emergencyLabel"),
      description: t("health.emergencyDescription"),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      {eventTypes.map((type) => (
        <Card
          key={type.id}
          className="cursor-pointer hover:border-primary transition-colors active:scale-95"
          onClick={() => onSelect(type.id)}
        >
          <CardContent className="p-4 sm:p-6 flex flex-col items-center text-center">
            <span className="text-4xl sm:text-5xl mb-2 sm:mb-3">{type.icon}</span>
            <h3 className="font-semibold text-base sm:text-lg mb-1">{type.label}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">{type.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
