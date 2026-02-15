import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useCreateSire } from "@/hooks/useReproduction";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CreateSireDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (sireId: string) => void;
}

export function CreateSireDialog({
  isOpen,
  onClose,
  onCreated,
}: CreateSireDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const mutation = useCreateSire();
  const [name, setName] = useState("");
  const [shortCode, setShortCode] = useState("");
  const [registryCode, setRegistryCode] = useState("");
  const [registryName, setRegistryName] = useState("");
  const [geneticNotes, setGeneticNotes] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) return;
    try {
      const result = await mutation.mutateAsync({
        name: name.trim(),
        short_code: shortCode.trim() || null,
        registry_code: registryCode.trim() || null,
        registry_name: registryName.trim() || null,
        genetic_notes: geneticNotes.trim() || null,
      });
      toast({ title: t("reproduction.sireCreated") });
      onCreated(result.id);
      onClose();
      setName("");
      setShortCode("");
      setRegistryCode("");
      setRegistryName("");
      setGeneticNotes("");
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("reproduction.createSireInline")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("reproduction.sireName")}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("reproduction.sireNamePlaceholder")}
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("reproduction.shortCode")}</Label>
              <Input
                value={shortCode}
                onChange={(e) => setShortCode(e.target.value)}
                placeholder={t("reproduction.shortCodePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("reproduction.registryCode")}</Label>
              <Input
                value={registryCode}
                onChange={(e) => setRegistryCode(e.target.value)}
                placeholder={t("reproduction.registryCodePlaceholder")}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("reproduction.registryName")}</Label>
            <Input
              value={registryName}
              onChange={(e) => setRegistryName(e.target.value)}
              placeholder={t("reproduction.registryNamePlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("reproduction.geneticNotes")}</Label>
            <Textarea
              value={geneticNotes}
              onChange={(e) => setGeneticNotes(e.target.value)}
              placeholder={t("reproduction.geneticNotesPlaceholder")}
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("reproduction.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || mutation.isPending}
          >
            {mutation.isPending
              ? t("reproduction.saving")
              : t("reproduction.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
