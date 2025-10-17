import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createHealthRecord } from "@/services/healthRecords";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";

interface EmergencyFormProps {
  animalId: string;
}

export default function EmergencyForm({ animalId }: EmergencyFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    occurred_at: new Date().toISOString().slice(0, 16),
    veterinarian: "",
    notes: "",
    cost: "",
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => createHealthRecord(animalId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["healthRecords", animalId] });
      queryClient.invalidateQueries({ queryKey: ["animal", animalId] });
      toast({
        title: t("health.emergencyRegistered"),
        description: t("health.emergencySavedSuccess"),
      });
      navigate(`/animals/${animalId}?tab=health`);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: t("health.error"),
        description: error.message || t("health.errorSavingEmergency"),
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createMutation.mutate({
      event_type: "EMERGENCY",
      occurred_at: formData.occurred_at,
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
        <CardTitle>🚑 {t("health.newEmergency")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t("health.emergencyAlert")}
          </AlertDescription>
        </Alert>

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
            <Label htmlFor="veterinarian">{t("health.veterinarian")}</Label>
            <Input
              type="text"
              id="veterinarian"
              name="veterinarian"
              placeholder={t("health.veterinarianWhoAttended")}
              value={formData.veterinarian}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t("health.emergencyDescription")} *</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder={t("health.emergencyPlaceholder")}
              value={formData.notes}
              onChange={handleChange}
              rows={6}
              required
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
              {createMutation.isPending ? t("health.saving") : t("health.saveEmergency")}
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
