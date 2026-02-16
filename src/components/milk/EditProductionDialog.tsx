import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/use-toast";
import { useIsAdmin } from "@/hooks/useAuth";
import { updateMilkProduction, type MilkProductionItem } from "@/services/milkProductions";
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
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/utils/format";

interface EditProductionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  production: MilkProductionItem | null;
  onSuccess?: () => void;
}

export default function EditProductionDialog({
  open,
  onOpenChange,
  production,
  onSuccess,
}: EditProductionDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const isAdmin = useIsAdmin();
  const queryClient = useQueryClient();

  const [inputQuantity, setInputQuantity] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (production && open) {
      setInputQuantity(production.input_quantity);
      setNotes(production.notes ?? "");
    }
  }, [production, open]);

  const mutation = useMutation({
    mutationFn: (payload: { version: number; input_quantity?: string; notes?: string }) =>
      updateMilkProduction(production!.id, payload),
  });

  if (!isAdmin || !production) return null;

  const handleSubmit = async () => {
    try {
      await mutation.mutateAsync({
        version: production.version,
        input_quantity: inputQuantity,
        notes: notes || undefined,
      });
      toast({
        title: t("milk.productionUpdated"),
        description: t("milk.productionUpdatedDescription"),
      });
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast({
        title: t("milk.couldNotUpdateProduction"),
        variant: "destructive",
      });
    }
  };

  const shift = production.shift || "AM";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("milk.editProductionTitle")}</DialogTitle>
          <DialogDescription>{t("milk.editProductionDescription")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{formatDate(production.date_time)}</span>
            <Badge variant={shift === "AM" ? "default" : "secondary"}>{shift}</Badge>
          </div>

          {/* Input quantity */}
          <div className="space-y-2">
            <Label htmlFor="edit-input-quantity">{t("milk.newQuantity")}</Label>
            <div className="flex items-center gap-2">
              <Input
                id="edit-input-quantity"
                type="number"
                step="0.01"
                min="0"
                value={inputQuantity}
                onChange={(e) => setInputQuantity(e.target.value)}
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {production.input_unit.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("milk.currentValue")}: {production.input_quantity} {production.input_unit.toUpperCase()}
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="edit-notes">{t("milk.notes")}</Label>
            <Textarea
              id="edit-notes"
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
          <Button onClick={handleSubmit} disabled={!inputQuantity || mutation.isPending}>
            {mutation.isPending ? t("milk.saving") : t("milk.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
