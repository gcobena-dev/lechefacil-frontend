import { useState, useEffect, useRef, useCallback } from "react";
import { Wifi, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/use-toast";
import {
  markAsImported,
  getDeviceBuffer,
  clearDeviceBuffer,
  matchDeviceRecords,
  getUidsFromRecords,
  isDeviceSyncAvailable,
} from "@/services/deviceSync";
import { fetchAllLactatingAnimals } from "@/services/animals";
import DeviceSyncWizard from "./DeviceSyncWizard";

interface OcrResult {
  animalId: string | null;
  animalName: string;
  liters: number;
  matchConfidence: number;
  extractedName: string;
}

interface DeviceSyncButtonProps {
  onResultsProcessed: (results: OcrResult[]) => void;
  disabled?: boolean;
  resetKey?: string | number;
}

export default function DeviceSyncButton({
  onResultsProcessed,
  disabled,
  resetKey,
}: DeviceSyncButtonProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [bufferCount, setBufferCount] = useState(0);
  const [importing, setImporting] = useState(false);
  const pendingUidsRef = useRef<string[]>([]);
  const initialResetKey = useRef(resetKey);

  const available = isDeviceSyncAvailable();

  // Check buffer on mount and when wizard closes
  const refreshBufferCount = useCallback(() => {
    const buffer = getDeviceBuffer();
    setBufferCount(buffer ? buffer.length : 0);
  }, []);

  useEffect(() => {
    refreshBufferCount();
  }, [refreshBufferCount]);

  // When resetKey changes (successful bulk submit), mark pending UIDs as imported
  useEffect(() => {
    if (resetKey === initialResetKey.current) return;
    if (pendingUidsRef.current.length > 0) {
      markAsImported(pendingUidsRef.current);
      pendingUidsRef.current = [];
    }
    setWizardOpen(false);
    refreshBufferCount();
  }, [resetKey, refreshBufferCount]);

  const handleBufferSaved = useCallback(() => {
    refreshBufferCount();
  }, [refreshBufferCount]);

  const handleImport = useCallback(async () => {
    if (!navigator.onLine) {
      toast({
        title: t("milk.deviceSyncOfflineTitle"),
        description: t("milk.deviceSyncImportNeedsInternet"),
        variant: "destructive",
      });
      return;
    }

    const buffer = getDeviceBuffer();
    if (!buffer || buffer.length === 0) {
      refreshBufferCount();
      return;
    }

    setImporting(true);
    try {
      // Fetch ALL lactating animals for proper matching
      const allAnimals = await fetchAllLactatingAnimals();
      const result = matchDeviceRecords(buffer, allAnimals);

      // Convert matched records to OcrResult format
      const ocrResults: OcrResult[] = result.matched.map((m) => ({
        animalId: m.animalId,
        animalName: m.animalName,
        liters: m.quantity,
        matchConfidence: 1,
        extractedName: m.tag,
      }));

      // Store UIDs for deferred marking (after successful submit)
      pendingUidsRef.current = getUidsFromRecords(buffer);

      // Clear the buffer
      clearDeviceBuffer();
      setBufferCount(0);

      // Pass results to form
      onResultsProcessed(ocrResults);

      // Show summary toast
      if (result.matched.length > 0) {
        toast({
          title: t("milk.deviceSyncSuccess", { count: result.matched.length }),
          description: result.unmatched.length > 0
            ? t("milk.deviceSyncUnmatched", { count: result.unmatched.length })
            : undefined,
        });
      } else {
        toast({
          title: t("milk.deviceSyncNoMatches"),
          description: result.unmatched.length > 0
            ? `${t("milk.deviceSyncUnmatched", { count: result.unmatched.length })}: ${result.unmatched.map((u) => u.codigo).join(", ")}`
            : t("milk.deviceSyncNoRecords"),
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: t("common.error"),
        description: t("milk.deviceSyncImportError"),
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  }, [onResultsProcessed, refreshBufferCount, toast, t]);

  if (!available) return null;

  return (
    <>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          disabled={disabled}
          onClick={() => setWizardOpen(true)}
        >
          <Wifi className="h-4 w-4 mr-2" />
          {t("milk.deviceSync")}
        </Button>

        {bufferCount > 0 && (
          <Button
            type="button"
            variant="default"
            className="flex-1"
            disabled={disabled || importing}
            onClick={handleImport}
          >
            {importing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {t("milk.deviceSyncImport")}
            <Badge variant="secondary" className="ml-2">
              {bufferCount}
            </Badge>
          </Button>
        )}
      </div>

      <DeviceSyncWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onBufferSaved={handleBufferSaved}
      />
    </>
  );
}
