import { useState, useCallback } from "react";
import { Loader2, CheckCircle, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  fetchDeviceRecords,
  matchDeviceRecords,
  getUidsFromRecords,
  type MatchResult,
  type DeviceRecord,
} from "@/services/deviceSync";

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

interface DeviceSyncWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResultsProcessed: (results: OcrResult[]) => void;
  onPendingUids: (uids: string[]) => void;
  animals: Animal[];
}

type WizardStep = "instructions" | "syncing" | "results";

export default function DeviceSyncWizard({
  open,
  onOpenChange,
  onResultsProcessed,
  onPendingUids,
  animals,
}: DeviceSyncWizardProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<WizardStep>("instructions");
  const [error, setError] = useState<string | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [allRecords, setAllRecords] = useState<DeviceRecord[]>([]);

  const reset = useCallback(() => {
    setStep("instructions");
    setError(null);
    setMatchResult(null);
    setAllRecords([]);
  }, []);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) reset();
      onOpenChange(open);
    },
    [onOpenChange, reset]
  );

  const handleSync = useCallback(async () => {
    setStep("syncing");
    setError(null);

    const result = await fetchDeviceRecords();

    if (!result.ok || !result.records) {
      if (result.errorType === "empty") {
        setError(t("milk.deviceSyncNoRecords"));
      } else {
        setError(t("milk.deviceSyncError"));
      }
      setStep("syncing"); // Stay on syncing step to show error + retry
      return;
    }

    const matched = matchDeviceRecords(result.records, animals);
    setMatchResult(matched);
    setAllRecords(result.records);
    setStep("results");
  }, [animals, t]);

  const handleAccept = useCallback(() => {
    if (!matchResult || !allRecords.length) {
      handleOpenChange(false);
      return;
    }

    // Convert matched records to OcrResult format
    const ocrResults: OcrResult[] = matchResult.matched.map((m) => ({
      animalId: m.animalId,
      animalName: m.animalName,
      liters: m.quantity,
      matchConfidence: 1,
      extractedName: m.tag,
    }));

    // Pass UIDs to parent for deferred marking (only after successful submit)
    onPendingUids(getUidsFromRecords(allRecords));

    onResultsProcessed(ocrResults);
    handleOpenChange(false);
  }, [matchResult, allRecords, onResultsProcessed, onPendingUids, handleOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("milk.deviceSyncStep1Title")}</DialogTitle>
          <DialogDescription className="sr-only">
            {t("milk.deviceSyncStep1Desc")}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Instructions */}
        {step === "instructions" && (
          <div className="space-y-4">
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>1. Conecta tu celular al WiFi <strong>&quot;Balanza&quot;</strong></p>
              <p>2. Presiona <strong>Sincronizar</strong></p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                {t("milk.cancelLabel")}
              </Button>
              <Button onClick={handleSync}>
                {t("milk.deviceSync")}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Syncing */}
        {step === "syncing" && (
          <div className="space-y-4">
            {!error ? (
              <div className="flex items-center justify-center gap-3 py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                  {t("milk.deviceSyncing")}
                </span>
              </div>
            ) : (
              <>
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => handleOpenChange(false)}>
                    {t("milk.cancelLabel")}
                  </Button>
                  <Button onClick={handleSync}>
                    {t("milk.deviceSyncRetry")}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 3: Results */}
        {step === "results" && matchResult && (
          <div className="space-y-4">
            {matchResult.matched.length > 0 && (
              <Alert className="border-green-200 bg-green-50 text-green-900">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {t("milk.deviceSyncSuccess", { count: matchResult.matched.length })}
                </AlertDescription>
              </Alert>
            )}

            {matchResult.unmatched.length > 0 && (
              <Alert className="border-yellow-200 bg-yellow-50 text-yellow-900">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <p className="font-medium">
                    {t("milk.deviceSyncUnmatched", { count: matchResult.unmatched.length })}
                  </p>
                  <p className="text-xs mt-1">
                    {matchResult.unmatched.map((u) => u.codigo).join(", ")}
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {matchResult.duplicates > 0 && (
              <Alert className="border-gray-200 bg-gray-50 text-gray-700">
                <Info className="h-4 w-4 text-gray-500" />
                <AlertDescription className="text-gray-600">
                  {t("milk.deviceSyncDuplicates", { count: matchResult.duplicates })}
                </AlertDescription>
              </Alert>
            )}

            {matchResult.matched.length === 0 && matchResult.unmatched.length === 0 && matchResult.duplicates === 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{t("milk.deviceSyncNoRecords")}</AlertDescription>
              </Alert>
            )}

            <Alert className="border-blue-200 bg-blue-50 text-blue-900">
              <Info className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-blue-800 text-xs">
                {t("milk.deviceSyncReconnect")}
              </AlertDescription>
            </Alert>

            <div className="flex justify-end">
              <Button onClick={handleAccept}>
                {t("milk.deviceSyncAccept")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
