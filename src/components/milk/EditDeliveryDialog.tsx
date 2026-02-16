import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/use-toast";
import { useIsAdmin } from "@/hooks/useAuth";
import { updateMilkDelivery } from "@/services/milkDeliveries";
import type { MilkDeliveryResponse } from "@/services/types";
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
import { formatDate } from "@/utils/format";

interface EditDeliveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  delivery: MilkDeliveryResponse | null;
  buyerName?: string;
  onSuccess?: () => void;
}

export default function EditDeliveryDialog({
  open,
  onOpenChange,
  delivery,
  buyerName,
  onSuccess,
}: EditDeliveryDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const isAdmin = useIsAdmin();

  const [volumeL, setVolumeL] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (delivery && open) {
      setVolumeL(String(delivery.volume_l));
      setNotes(delivery.notes ?? "");
    }
  }, [delivery, open]);

  const mutation = useMutation({
    mutationFn: (payload: { version: number; volume_l?: number; notes?: string }) =>
      updateMilkDelivery(delivery!.id, payload),
  });

  if (!isAdmin || !delivery) return null;

  const handleSubmit = async () => {
    const parsed = parseFloat(volumeL);
    if (isNaN(parsed) || parsed <= 0) return;

    try {
      await mutation.mutateAsync({
        version: delivery.version,
        volume_l: parsed,
        notes: notes || undefined,
      });
      toast({
        title: t("milk.deliveryUpdated"),
        description: t("milk.deliveryUpdatedDescription"),
      });
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast({
        title: t("milk.couldNotUpdateDelivery"),
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("milk.editDeliveryTitle")}</DialogTitle>
          <DialogDescription>{t("milk.editDeliveryDescription")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info */}
          <div className="text-sm text-muted-foreground space-y-1">
            <p>{buyerName ?? delivery.buyer_name ?? t("milk.unknownBuyer")}</p>
            <p>{formatDate(delivery.date_time)}</p>
          </div>

          {/* Volume */}
          <div className="space-y-2">
            <Label htmlFor="edit-volume">{t("milk.newVolume")}</Label>
            <Input
              id="edit-volume"
              type="number"
              step="0.1"
              min="0"
              value={volumeL}
              onChange={(e) => setVolumeL(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {t("milk.currentValue")}: {delivery.volume_l} L
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="edit-delivery-notes">{t("milk.notes")}</Label>
            <Textarea
              id="edit-delivery-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("milk.cancelLabel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!volumeL || parseFloat(volumeL) <= 0 || mutation.isPending}
          >
            {mutation.isPending ? t("milk.saving") : t("milk.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
