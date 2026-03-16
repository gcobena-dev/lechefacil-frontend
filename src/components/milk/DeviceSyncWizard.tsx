import { useState, useCallback } from "react";
import { Loader2, CheckCircle, AlertCircle, Info, Copy, Check, Usb, Wifi } from "lucide-react";
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
  getAvailableSyncMethods,
  type SyncMethod,
} from "@/services/deviceSync";

interface DeviceSyncWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBufferSaved: () => void;
}

type WizardStep = "method" | "instructions" | "syncing" | "result";

export default function DeviceSyncWizard({
  open,
  onOpenChange,
  onBufferSaved,
}: DeviceSyncWizardProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<WizardStep>("method");
  const [method, setMethod] = useState<SyncMethod>("usb");
  const [error, setError] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [recordCount, setRecordCount] = useState(0);

  const availableMethods = getAvailableSyncMethods();

  const reset = useCallback(() => {
    setStep("method");
    setError(null);
    setErrorDetail(null);
    setCopied(false);
    setRecordCount(0);
  }, []);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) reset();
      onOpenChange(open);
    },
    [onOpenChange, reset]
  );

  const handleCopyError = useCallback(async () => {
    if (!errorDetail) return;
    try {
      await navigator.clipboard.writeText(errorDetail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }, [errorDetail]);

  const handleSelectMethod = useCallback((m: SyncMethod) => {
    setMethod(m);
    if (m === "wifi") {
      setStep("instructions");
    } else {
      // USB doesn't need instructions, go straight to sync
      setStep("syncing");
      doSync(m);
    }
  }, []);

  const doSync = useCallback(async (syncMethod: SyncMethod) => {
    setStep("syncing");
    setError(null);
    setErrorDetail(null);
    setCopied(false);

    const result = await fetchDeviceRecords(syncMethod);

    if (!result.ok || !result.records) {
      if (result.errorType === "empty") {
        setError(t("milk.deviceSyncNoRecords"));
      } else {
        setError(t("milk.deviceSyncError"));
        setErrorDetail(`[${result.errorType}] ${result.error}`);
      }
      setStep("syncing");
      return;
    }

    saveDeviceBuffer(result.records);
    setRecordCount(result.records.length);
    setStep("result");
    onBufferSaved();
  }, [t, onBufferSaved]);

  const handleSyncWifi = useCallback(() => {
    doSync("wifi");
  }, [doSync]);

  const handleRetry = useCallback(() => {
    doSync(method);
  }, [doSync, method]);

  const handleClose = useCallback(() => {
    handleOpenChange(false);
  }, [handleOpenChange]);

  const handleBack = useCallback(() => {
    setError(null);
    setErrorDetail(null);
    setStep("method");
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("milk.deviceSyncStep1Title")}</DialogTitle>
          <DialogDescription className="sr-only">
            {t("milk.deviceSyncStep1Desc")}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Choose method */}
        {step === "method" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Selecciona cómo conectar con la balanza:
            </p>
            <div className="grid gap-2">
              {availableMethods.includes("usb") && (
                <Button
                  variant="outline"
                  className="justify-start h-auto py-3 px-4"
                  onClick={() => handleSelectMethod("usb")}
                >
                  <Usb className="h-5 w-5 mr-3 shrink-0" />
                  <div className="text-left">
                    <div className="font-medium">Cable USB</div>
                    <div className="text-xs text-muted-foreground">
                      Conecta la balanza por cable USB al dispositivo
                    </div>
                  </div>
                </Button>
              )}
              {availableMethods.includes("wifi") && (
                <Button
                  variant="outline"
                  className="justify-start h-auto py-3 px-4"
                  onClick={() => handleSelectMethod("wifi")}
                >
                  <Wifi className="h-5 w-5 mr-3 shrink-0" />
                  <div className="text-left">
                    <div className="font-medium">WiFi &quot;Balanza&quot;</div>
                    <div className="text-xs text-muted-foreground">
                      Conéctate a la red WiFi de la balanza
                    </div>
                  </div>
                </Button>
              )}
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                {t("milk.cancelLabel")}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: WiFi instructions (only for WiFi method) */}
        {step === "instructions" && (
          <div className="space-y-4">
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>1. Conecta tu celular al WiFi <strong>&quot;Balanza&quot;</strong></p>
              <p>2. Presiona <strong>Sincronizar</strong></p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleBack}>
                Atrás
              </Button>
              <Button onClick={handleSyncWifi}>
                {t("milk.deviceSync")}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Syncing */}
        {step === "syncing" && (
          <div className="space-y-4">
            {!error ? (
              <div className="flex items-center justify-center gap-3 py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                  {method === "usb"
                    ? "Leyendo datos por USB..."
                    : t("milk.deviceSyncing")}
                </span>
              </div>
            ) : (
              <>
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
                {errorDetail && (
                  <div className="relative rounded-md bg-muted p-3">
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-all pr-8">
                      {errorDetail}
                    </pre>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-1.5 right-1.5 h-7 w-7"
                      onClick={handleCopyError}
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                )}
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={handleBack}>
                    Atrás
                  </Button>
                  <Button onClick={handleRetry}>
                    {t("milk.deviceSyncRetry")}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 4: Result */}
        {step === "result" && (
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50 text-green-900">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {t("milk.deviceSyncBufferSaved", { count: recordCount })}
              </AlertDescription>
            </Alert>

            {method === "wifi" && (
              <Alert className="border-blue-200 bg-blue-50 text-blue-900">
                <Info className="h-4 w-4 text-blue-500" />
                <AlertDescription className="text-blue-800 text-xs">
                  {t("milk.deviceSyncReconnectToImport")}
                </AlertDescription>
              </Alert>
            )}

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
