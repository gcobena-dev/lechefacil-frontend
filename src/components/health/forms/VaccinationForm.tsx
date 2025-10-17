import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createHealthRecord } from "@/services/healthRecords";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";

interface VaccinationFormProps {
  animalId: string;
}

export default function VaccinationForm({ animalId }: VaccinationFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    occurred_at: new Date().toISOString().slice(0, 16),
    vaccine_name: "",
    veterinarian: "",
    notes: "",
    cost: "",
    has_next_dose: false,
    next_dose_date: "",
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => createHealthRecord(animalId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["healthRecords", animalId] });
      queryClient.invalidateQueries({ queryKey: ["animal", animalId] });
      toast({
        title: t("health.vaccinationRegistered"),
        description: t("health.vaccinationSavedSuccess"),
      });
      navigate(`/animals/${animalId}?tab=health`);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: t("health.error"),
        description: error.message || t("health.errorSavingVaccination"),
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createMutation.mutate({
      event_type: "VACCINATION",
      occurred_at: formData.occurred_at,
      vaccine_name: formData.vaccine_name,
      veterinarian: formData.veterinarian || undefined,
      notes: formData.notes || undefined,
      cost: formData.cost ? parseFloat(formData.cost) : undefined,
      next_dose_date: formData.has_next_dose ? formData.next_dose_date : undefined,
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>💉 {t("health.newVaccination")}</CardTitle>
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

          <div className="space-y-2">
            <Label htmlFor="vaccine_name">{t("health.vaccineName")} *</Label>
            <Input
              type="text"
              id="vaccine_name"
              name="vaccine_name"
              placeholder={t("health.vaccineNamePlaceholder")}
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
                setFormData((prev) => ({
                  ...prev,
                  has_next_dose: !!checked,
                }))
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

          <div className="space-y-2">
            <Label htmlFor="veterinarian">{t("health.veterinarian")}</Label>
            <Input
              type="text"
              id="veterinarian"
              name="veterinarian"
              placeholder={t("health.veterinarianPlaceholder")}
              value={formData.veterinarian}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t("health.notes")}</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder={t("health.notesPlaceholder")}
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
              placeholder="0.00"
              step="0.01"
              min="0"
              value={formData.cost}
              onChange={handleChange}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button type="submit" disabled={createMutation.isPending} className="w-full sm:w-auto">
              {createMutation.isPending ? t("health.saving") : t("health.saveVaccination")}
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
  );
}
