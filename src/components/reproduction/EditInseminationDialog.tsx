import { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/use-toast";
import { useIsAdmin } from "@/hooks/useAuth";
import { useUpdateInsemination } from "@/hooks/useReproduction";
import type { InseminationResponse } from "@/services/inseminations";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { SireSelector } from "@/components/reproduction/SireSelector";
import { TechnicianAutocomplete } from "@/components/reproduction/TechnicianAutocomplete";

interface EditInseminationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  insemination: InseminationResponse | null;
}

// An ISO instant rendered as the local "YYYY-MM-DDTHH:mm" a datetime-local
// input expects.
function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export default function EditInseminationDialog({
  open,
  onOpenChange,
  insemination,
}: EditInseminationDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const isAdmin = useIsAdmin();

  const [serviceDate, setServiceDate] = useState("");
  const [technician, setTechnician] = useState("");
  const [protocol, setProtocol] = useState("");
  const [heatDetected, setHeatDetected] = useState(false);
  const [notes, setNotes] = useState("");
  const [sireId, setSireId] = useState("");

  const mutation = useUpdateInsemination();

  useEffect(() => {
    if (insemination && open) {
      setServiceDate(toLocalInputValue(insemination.service_date));
      setTechnician(insemination.technician ?? "");
      setProtocol(insemination.protocol ?? "");
      setHeatDetected(insemination.heat_detected);
      setNotes(insemination.notes ?? "");
      setSireId(insemination.sire_catalog_id ?? "");
    }
  }, [insemination, open]);

  if (!isAdmin || !insemination) return null;

  const handleSubmit = async () => {
    try {
      await mutation.mutateAsync({
        id: insemination.id,
        payload: {
          service_date: serviceDate ? new Date(serviceDate).toISOString() : undefined,
          technician: technician || undefined,
          protocol: protocol || undefined,
          heat_detected: heatDetected,
          notes: notes || undefined,
          sire_catalog_id: sireId || null,
        },
      });
      toast({ title: t("reproduction.inseminationUpdated") });
      onOpenChange(false);
    } catch {
      toast({
        title: t("reproduction.inseminationUpdated"),
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("reproduction.editInsemination")}</DialogTitle>
          <DialogDescription>{t("reproduction.editInseminationDescription")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-service-date">{t("reproduction.serviceDate")}</Label>
            <Input
              id="edit-service-date"
              type="datetime-local"
              value={serviceDate}
              onChange={(e) => setServiceDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("reproduction.selectSire")}</Label>
            <SireSelector value={sireId} onValueChange={setSireId} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-technician">{t("reproduction.technician")}</Label>
            <TechnicianAutocomplete
              id="edit-technician"
              value={technician}
              onChange={setTechnician}
              placeholder={t("reproduction.technicianPlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-protocol">{t("reproduction.protocol")}</Label>
            <Input
              id="edit-protocol"
              value={protocol}
              onChange={(e) => setProtocol(e.target.value)}
              placeholder={t("reproduction.protocolPlaceholder")}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="edit-heat">{t("reproduction.heatDetected")}</Label>
            <Switch
              id="edit-heat"
              checked={heatDetected}
              onCheckedChange={setHeatDetected}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-notes">{t("reproduction.notes")}</Label>
            <Textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("reproduction.notesPlaceholder")}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("reproduction.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? t("reproduction.saving") : t("reproduction.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
