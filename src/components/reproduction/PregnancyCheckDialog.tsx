import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useRecordPregnancyCheck } from "@/hooks/useReproduction";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PregnancyCheckDialogProps {
  inseminationId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PregnancyCheckDialog({
  inseminationId,
  isOpen,
  onClose,
}: PregnancyCheckDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const mutation = useRecordPregnancyCheck();
  const [result, setResult] = useState<string>("");
  const [checkDate, setCheckDate] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [checkedBy, setCheckedBy] = useState("");

  const handleSubmit = async () => {
    if (!result) return;
    try {
      await mutation.mutateAsync({
        inseminationId,
        payload: {
          result,
          check_date: new Date(checkDate).toISOString(),
          checked_by: checkedBy || null,
        },
      });
      toast({
        title: t("reproduction.pregnancyCheckRecorded"),
      });
      onClose();
    } catch {
      toast({
        title: "Error",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-lg px-6 py-6">
        <DialogHeader>
          <DialogTitle>{t("reproduction.recordCheck")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("reproduction.checkResult")}</Label>
            <Select value={result} onValueChange={setResult}>
              <SelectTrigger>
                <SelectValue placeholder={t("reproduction.checkResult")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CONFIRMED">
                  {t("reproduction.confirmed")}
                </SelectItem>
                <SelectItem value="OPEN">{t("reproduction.open")}</SelectItem>
                <SelectItem value="LOST">{t("reproduction.lost")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("reproduction.checkDate")}</Label>
            <Input
              type="datetime-local"
              value={checkDate}
              onChange={(e) => setCheckDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("reproduction.checkedBy")}</Label>
            <Input
              value={checkedBy}
              onChange={(e) => setCheckedBy(e.target.value)}
              placeholder={t("reproduction.checkedByPlaceholder")}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            {t("reproduction.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!result || mutation.isPending}
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
