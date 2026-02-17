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

interface EditInseminationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  insemination: InseminationResponse | null;
}

export default function EditInseminationDialog({
  open,
  onOpenChange,
  insemination,
}: EditInseminationDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const isAdmin = useIsAdmin();

  const [technician, setTechnician] = useState("");
  const [protocol, setProtocol] = useState("");
  const [heatDetected, setHeatDetected] = useState(false);
  const [notes, setNotes] = useState("");

  const mutation = useUpdateInsemination();

  useEffect(() => {
    if (insemination && open) {
      setTechnician(insemination.technician ?? "");
      setProtocol(insemination.protocol ?? "");
      setHeatDetected(insemination.heat_detected);
      setNotes(insemination.notes ?? "");
    }
  }, [insemination, open]);

  if (!isAdmin || !insemination) return null;

  const handleSubmit = async () => {
    try {
      await mutation.mutateAsync({
        id: insemination.id,
        payload: {
          technician: technician || undefined,
          protocol: protocol || undefined,
          heat_detected: heatDetected,
          notes: notes || undefined,
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
            <Label htmlFor="edit-technician">{t("reproduction.technician")}</Label>
            <Input
              id="edit-technician"
              value={technician}
              onChange={(e) => setTechnician(e.target.value)}
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
