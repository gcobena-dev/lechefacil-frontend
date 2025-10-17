import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAnimal } from "@/services/animals";
import { getHealthRecord, updateHealthRecord } from "@/services/healthRecords";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

export default function EditHealthEvent() {
  const { t } = useTranslation();
  const { id: animalId, healthRecordId } = useParams<{ id: string; healthRecordId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: animal, isLoading: animalLoading } = useQuery({
    queryKey: ["animal", animalId],
    queryFn: () => getAnimal(animalId!),
    enabled: !!animalId,
  });

  const { data: healthRecord, isLoading: recordLoading } = useQuery({
    queryKey: ["healthRecord", animalId, healthRecordId],
    queryFn: () => getHealthRecord(animalId!, healthRecordId!),
    enabled: !!animalId && !!healthRecordId,
  });

  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (healthRecord) {
      setFormData({
        occurred_at: healthRecord.occurred_at ? new Date(healthRecord.occurred_at).toISOString().slice(0, 16) : "",
        veterinarian: healthRecord.veterinarian || "",
        notes: healthRecord.notes || "",
        cost: healthRecord.cost?.toString() || "",
        vaccine_name: healthRecord.vaccine_name || "",
        next_dose_date: healthRecord.next_dose_date || "",
        medication: healthRecord.medication || "",
        duration_days: healthRecord.duration_days?.toString() || "",
        withdrawal_days: healthRecord.withdrawal_days?.toString() || "",
        has_withdrawal: !!healthRecord.withdrawal_days,
        has_next_dose: !!healthRecord.next_dose_date,
      });
    }
  }, [healthRecord]);

  const updateMutation = useMutation({
    mutationFn: (payload: any) => updateHealthRecord(animalId!, healthRecordId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["healthRecords", animalId] });
      queryClient.invalidateQueries({ queryKey: ["healthRecord", animalId, healthRecordId] });
      queryClient.invalidateQueries({ queryKey: ["animal", animalId] });
      toast({
        title: t("health.healthRecordUpdated"),
        description: t("health.healthRecordUpdateSuccess"),
      });
      navigate(`/animals/${animalId}?tab=health`);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: t("health.error"),
        description: error.message || t("health.errorUpdatingHealthRecord"),
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: any = {
      occurred_at: formData.occurred_at,
      veterinarian: formData.veterinarian || undefined,
      notes: formData.notes || undefined,
      cost: formData.cost ? parseFloat(formData.cost) : undefined,
    };

    if (healthRecord?.event_type === "VACCINATION") {
      payload.vaccine_name = formData.vaccine_name;
      payload.next_dose_date = formData.has_next_dose ? formData.next_dose_date : undefined;
    }

    if (healthRecord?.event_type === "TREATMENT") {
      payload.medication = formData.medication;
      payload.duration_days = parseInt(formData.duration_days);
      payload.withdrawal_days = formData.has_withdrawal ? parseInt(formData.withdrawal_days) : undefined;
    }

    updateMutation.mutate(payload);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev: any) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (animalLoading || recordLoading) {
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

  if (!healthRecord) {
    return (
      <div className="container mx-auto py-6">
        <p>{t("health.healthRecordNotFound")}</p>
      </div>
    );
  }

  const getEventIcon = (type: string) => {
    const icons = {
      VACCINATION: "💉",
      TREATMENT: "💊",
      VET_OBSERVATION: "🩺",
      EMERGENCY: "🚑",
    };
    return icons[type as keyof typeof icons] || "📋";
  };

  const getEventTitle = (type: string) => {
    const titles = {
      VACCINATION: t("health.editVaccination"),
      TREATMENT: t("health.editTreatment"),
      VET_OBSERVATION: t("health.editObservation"),
      EMERGENCY: t("health.editEmergency"),
    };
    return titles[type as keyof typeof titles] || t("health.editHealthEvent");
  };

  return (
    <div className="container mx-auto py-4 px-4 sm:py-6 space-y-4 sm:space-y-6 max-w-4xl">
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
          <h1 className="text-xl sm:text-2xl font-bold">{t("health.editHealthEvent")}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t("health.animalColon")} {animal.tag} {animal.name ? `- ${animal.name}` : ""}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{getEventIcon(healthRecord.event_type)} {getEventTitle(healthRecord.event_type)}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="occurred_at">{t("health.dateAndTime")} *</Label>
              <Input
                type="datetime-local"
                id="occurred_at"
                name="occurred_at"
                value={formData.occurred_at}
                onChange={handleChange}
                required
              />
            </div>

            {healthRecord.event_type === "VACCINATION" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="vaccine_name">{t("health.vaccineName")} *</Label>
                  <Input
                    type="text"
                    id="vaccine_name"
                    name="vaccine_name"
                    value={formData.vaccine_name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_next_dose"
                    checked={formData.has_next_dose}
                    onCheckedChange={(checked) =>
                      setFormData((prev: any) => ({ ...prev, has_next_dose: !!checked }))
                    }
                  />
                  <Label htmlFor="has_next_dose" className="cursor-pointer">
                    {t("health.requiresNextDose")}
                  </Label>
                </div>

                {formData.has_next_dose && (
                  <div className="space-y-2">
                    <Label htmlFor="next_dose_date">{t("health.nextDoseDate")}</Label>
                    <Input
                      type="date"
                      id="next_dose_date"
                      name="next_dose_date"
                      value={formData.next_dose_date}
                      onChange={handleChange}
                    />
                  </div>
                )}
              </>
            )}

            {healthRecord.event_type === "TREATMENT" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="medication">{t("health.medicationRequired")} *</Label>
                  <Input
                    type="text"
                    id="medication"
                    name="medication"
                    value={formData.medication}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration_days">{t("health.treatmentDuration")} *</Label>
                  <Input
                    type="number"
                    id="duration_days"
                    name="duration_days"
                    min="1"
                    value={formData.duration_days}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_withdrawal"
                    checked={formData.has_withdrawal}
                    onCheckedChange={(checked) =>
                      setFormData((prev: any) => ({ ...prev, has_withdrawal: !!checked }))
                    }
                  />
                  <Label htmlFor="has_withdrawal" className="cursor-pointer">
                    {t("health.requiresWithdrawal")}
                  </Label>
                </div>

                {formData.has_withdrawal && (
                  <div className="space-y-2">
                    <Label htmlFor="withdrawal_days">{t("health.withdrawalDaysAfter")} *</Label>
                    <Input
                      type="number"
                      id="withdrawal_days"
                      name="withdrawal_days"
                      min="1"
                      value={formData.withdrawal_days}
                      onChange={handleChange}
                      required={formData.has_withdrawal}
                    />
                  </div>
                )}
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="veterinarian">{t("health.veterinarian")}</Label>
              <Input
                type="text"
                id="veterinarian"
                name="veterinarian"
                value={formData.veterinarian}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t("health.notes")}</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">{t("health.cost")}</Label>
              <Input
                type="number"
                id="cost"
                name="cost"
                step="0.01"
                min="0"
                value={formData.cost}
                onChange={handleChange}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button type="submit" disabled={updateMutation.isPending} className="w-full sm:w-auto">
                {updateMutation.isPending ? t("health.saving") : t("health.saveChanges")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/animals/${animalId}?tab=health`)}
                className="w-full sm:w-auto"
              >
                {t("health.cancel")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
