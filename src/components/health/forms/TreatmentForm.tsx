import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createHealthRecord } from "@/services/healthRecords";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";

interface TreatmentFormProps {
  animalId: string;
}

export default function TreatmentForm({ animalId }: TreatmentFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    occurred_at: new Date().toISOString().slice(0, 16),
    medication: "",
    duration_days: "",
    has_withdrawal: false,
    withdrawal_days: "",
    veterinarian: "",
    notes: "",
    cost: "",
  });

  const [withdrawalUntil, setWithdrawalUntil] = useState<string>("");

  useEffect(() => {
    if (
      formData.has_withdrawal &&
      formData.duration_days &&
      formData.withdrawal_days
    ) {
      const startDate = new Date(formData.occurred_at);
      const endTreatment = new Date(startDate);
      endTreatment.setDate(
        endTreatment.getDate() + parseInt(formData.duration_days)
      );
      const endWithdrawal = new Date(endTreatment);
      endWithdrawal.setDate(
        endWithdrawal.getDate() + parseInt(formData.withdrawal_days)
      );
      setWithdrawalUntil(endWithdrawal.toLocaleDateString("es-ES"));
    } else {
      setWithdrawalUntil("");
    }
  }, [
    formData.occurred_at,
    formData.duration_days,
    formData.withdrawal_days,
    formData.has_withdrawal,
  ]);

  const createMutation = useMutation({
    mutationFn: (payload: any) => createHealthRecord(animalId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["healthRecords", animalId] });
      queryClient.invalidateQueries({ queryKey: ["animal", animalId] });
      toast({
        title: t("health.treatmentRegistered"),
        description: t("health.treatmentSavedSuccess"),
      });
      navigate(`/animals/${animalId}?tab=health`);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: t("health.error"),
        description: error.message || t("health.errorSavingTreatment"),
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createMutation.mutate({
      event_type: "TREATMENT",
      occurred_at: formData.occurred_at,
      medication: formData.medication,
      duration_days: parseInt(formData.duration_days),
      withdrawal_days: formData.has_withdrawal
        ? parseInt(formData.withdrawal_days)
        : undefined,
      veterinarian: formData.veterinarian || undefined,
      notes: formData.notes || undefined,
      cost: formData.cost ? parseFloat(formData.cost) : undefined,
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
        <CardTitle>💊 {t("health.newTreatment")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="occurred_at">{t("health.startDateAndTime")} *</Label>
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
            <Label htmlFor="medication">{t("health.medicationRequired")} *</Label>
            <Input
              type="text"
              id="medication"
              name="medication"
              placeholder={t("health.medicationPlaceholder")}
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
              placeholder={t("health.durationPlaceholder")}
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
                setFormData((prev) => ({
                  ...prev,
                  has_withdrawal: !!checked,
                }))
              }
            />
            <Label htmlFor="has_withdrawal" className="cursor-pointer">
              {t("health.requiresWithdrawal")}
            </Label>
          </div>

          {formData.has_withdrawal && (
            <>
              <div className="space-y-2">
                <Label htmlFor="withdrawal_days">
                  {t("health.withdrawalDaysAfter")} *
                </Label>
                <Input
                  type="number"
                  id="withdrawal_days"
                  name="withdrawal_days"
                  placeholder={t("health.withdrawalDaysPlaceholder")}
                  min="1"
                  value={formData.withdrawal_days}
                  onChange={handleChange}
                  required={formData.has_withdrawal}
                />
              </div>

              {withdrawalUntil && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{t("health.estimatedWithdrawalEnd")}:</strong>{" "}
                    {withdrawalUntil}
                    <br />
                    <span className="text-sm text-muted-foreground">
                      {t("health.doNotMilkUntilDate")}
                    </span>
                  </AlertDescription>
                </Alert>
              )}
            </>
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
              placeholder={t("health.symptomsSeverity")}
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
              {createMutation.isPending ? t("health.saving") : t("health.saveTreatment")}
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
