import { useState, useCallback } from "react";
import { Loader2, CheckCircle, AlertCircle, Info } from "lucide-react";
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
  saveDeviceBuffer,
} from "@/services/deviceSync";

interface DeviceSyncWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBufferSaved: () => void;
}

type WizardStep = "instructions" | "syncing" | "result";

export default function DeviceSyncWizard({
  open,
  onOpenChange,
  onBufferSaved,
}: DeviceSyncWizardProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<WizardStep>("instructions");
  const [error, setError] = useState<string | null>(null);
  const [recordCount, setRecordCount] = useState(0);

  const reset = useCallback(() => {
    setStep("instructions");
    setError(null);
    setRecordCount(0);
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
      setStep("syncing"); // Stay to show error + retry
      return;
    }

    // Phase 1: Save raw records to local buffer
    saveDeviceBuffer(result.records);
    setRecordCount(result.records.length);
    setStep("result");
    onBufferSaved();
  }, [t, onBufferSaved]);

  const handleClose = useCallback(() => {
    handleOpenChange(false);
  }, [handleOpenChange]);

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

        {/* Step 3: Result - records saved to buffer */}
        {step === "result" && (
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50 text-green-900">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {t("milk.deviceSyncBufferSaved", { count: recordCount })}
              </AlertDescription>
            </Alert>

            <Alert className="border-blue-200 bg-blue-50 text-blue-900">
              <Info className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-blue-800 text-xs">
                {t("milk.deviceSyncReconnectToImport")}
              </AlertDescription>
            </Alert>

            <div className="flex justify-end">
              <Button onClick={handleClose}>
                {t("common.close")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
