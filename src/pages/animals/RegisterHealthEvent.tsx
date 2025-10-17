import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getAnimal } from "@/services/animals";
import EventTypeSelector from "@/components/health/forms/EventTypeSelector";
import VaccinationForm from "@/components/health/forms/VaccinationForm";
import TreatmentForm from "@/components/health/forms/TreatmentForm";
import ObservationForm from "@/components/health/forms/ObservationForm";
import EmergencyForm from "@/components/health/forms/EmergencyForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

type EventType = "VACCINATION" | "TREATMENT" | "VET_OBSERVATION" | "EMERGENCY" | null;

export default function RegisterHealthEvent() {
  const { t } = useTranslation();
  const { id: animalId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<EventType>(null);

  const { data: animal, isLoading } = useQuery({
    queryKey: ["animal", animalId],
    queryFn: () => getAnimal(animalId!),
    enabled: !!animalId,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <p>{t("health.loading")}</p>
      </div>
    );
  }

  if (!animal) {
    return (
      <div className="container mx-auto py-6">
        <p>{t("health.animalNotFound")}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 px-4 sm:py-6 space-y-4 sm:space-y-6 max-w-4xl">
      {/* Header */}
      <div className="space-y-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/animals/${animalId}?tab=health`)}
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("health.back")}
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{t("health.registerHealthEvent")}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t("health.animalColon")} {animal.tag} {animal.name ? `- ${animal.name}` : ""}
          </p>
        </div>
      </div>

      {/* Event Type Selection or Form */}
      {!selectedType ? (
        <EventTypeSelector onSelect={setSelectedType} />
      ) : (
        <div className="space-y-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedType(null)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("health.changeEventType")}
          </Button>

          {selectedType === "VACCINATION" && (
            <VaccinationForm animalId={animalId!} />
          )}
          {selectedType === "TREATMENT" && (
            <TreatmentForm animalId={animalId!} />
          )}
          {selectedType === "VET_OBSERVATION" && (
            <ObservationForm animalId={animalId!} />
          )}
          {selectedType === "EMERGENCY" && (
            <EmergencyForm animalId={animalId!} />
          )}
        </div>
      )}
    </div>
  );
}
