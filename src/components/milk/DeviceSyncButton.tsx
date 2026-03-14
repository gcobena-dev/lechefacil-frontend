import { useState, useEffect, useRef, useCallback } from "react";
import { Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { markAsImported } from "@/services/deviceSync";
import DeviceSyncWizard from "./DeviceSyncWizard";

interface OcrResult {
  animalId: string | null;
  animalName: string;
  liters: number;
  matchConfidence: number;
  extractedName: string;
}

interface Animal {
  id: string;
  name: string;
  tag: string;
}

interface DeviceSyncButtonProps {
  onResultsProcessed: (results: OcrResult[]) => void;
  animals: Animal[];
  disabled?: boolean;
  resetKey?: string | number;
}

export default function DeviceSyncButton({
  onResultsProcessed,
  animals,
  disabled,
  resetKey,
}: DeviceSyncButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const pendingUidsRef = useRef<string[]>([]);
  const initialResetKey = useRef(resetKey);

  const handlePendingUids = useCallback((uids: string[]) => {
    pendingUidsRef.current = uids;
  }, []);

  // When resetKey changes (successful bulk submit), mark pending UIDs as imported
  useEffect(() => {
    if (resetKey === initialResetKey.current) return; // skip initial render
    if (pendingUidsRef.current.length > 0) {
      markAsImported(pendingUidsRef.current);
      pendingUidsRef.current = [];
    }
    setOpen(false);
  }, [resetKey]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        <Wifi className="h-4 w-4 mr-2" />
        {t("milk.deviceSync")}
      </Button>

      <DeviceSyncWizard
        open={open}
        onOpenChange={setOpen}
        onResultsProcessed={onResultsProcessed}
        onPendingUids={handlePendingUids}
        animals={animals}
      />
    </>
  );
}
