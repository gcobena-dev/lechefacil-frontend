import { useState, useCallback, useEffect } from "react";
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
  fetchAllPendingRecords,
  matchDeviceRecords,
  markAsImported,
  type DeviceRecord,
  type MatchedDeviceRecord,
  type UnmatchedDeviceRecord,
} from "@/services/deviceSync";
import { fetchAllLactatingAnimals } from "@/services/animals";

interface OcrResult {
  animalId: string | null;
  animalName: string;
  liters: number;
  matchConfidence: number;
  extractedName: string;
}

interface DeviceSyncWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResultsProcessed: (results: OcrResult[]) => void;
}

type WizardStep = "loading" | "result" | "error" | "empty";

export default function DeviceSyncWizard({
  open,
  onOpenChange,
  onResultsProcessed,
}: DeviceSyncWizardProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<WizardStep>("loading");
  const [error, setError] = useState<string | null>(null);
  const [matched, setMatched] = useState<MatchedDeviceRecord[]>([]);
  const [unmatched, setUnmatched] = useState<UnmatchedDeviceRecord[]>([]);
  const [records, setRecords] = useState<DeviceRecord[]>([]);

  const doFetch = useCallback(async () => {
    setStep("loading");
    setError(null);

    try {
      const pendingRecords = await fetchAllPendingRecords();

      if (pendingRecords.length === 0) {
        setStep("empty");
        return;
      }

      setRecords(pendingRecords);

      const allAnimals = await fetchAllLactatingAnimals();
      const result = matchDeviceRecords(pendingRecords, allAnimals);

      setMatched(result.matched);
      setUnmatched(result.unmatched);
      setStep("result");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al obtener registros");
      setStep("error");
    }
  }, []);

  useEffect(() => {
    if (open) doFetch();
  }, [open, doFetch]);

  const handleImport = useCallback(() => {
    const ocrResults: OcrResult[] = matched.map((m) => ({
      animalId: m.animalId,
      animalName: m.animalName,
      liters: m.quantity,
      matchConfidence: 1,
      extractedName: m.tag,
    }));

    // Mark as imported
    markAsImported(records.map((r) => r.id));

    onResultsProcessed(ocrResults);
    onOpenChange(false);
  }, [matched, records, onResultsProcessed, onOpenChange]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar desde Balanza</DialogTitle>
          <DialogDescription className="sr-only">
            Importar registros pendientes desde la balanza
          </DialogDescription>
        </DialogHeader>

        {/* Loading */}
        {step === "loading" && (
          <div className="flex items-center justify-center gap-3 py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              Obteniendo registros pendientes...
            </span>
          </div>
        )}

        {/* Empty */}
        {step === "empty" && (
          <div className="space-y-4">
            <Alert className="border-blue-200 bg-blue-50 text-blue-900">
              <Info className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-blue-800">
                No hay registros pendientes en la balanza.
              </AlertDescription>
            </Alert>
            <div className="flex justify-end">
              <Button onClick={handleClose}>{t("common.close")}</Button>
            </div>
          </div>
        )}

        {/* Error */}
        {step === "error" && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleClose}>
                {t("milk.cancelLabel")}
              </Button>
              <Button onClick={doFetch}>Reintentar</Button>
            </div>
          </div>
        )}

        {/* Results */}
        {step === "result" && (
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50 text-green-900">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {matched.length} registros coinciden con animales
              </AlertDescription>
            </Alert>

            {/* Matched list */}
            {matched.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-1">
                {matched.map((m) => (
                  <div
                    key={m.animalId}
                    className="flex justify-between text-sm px-2 py-1 bg-muted rounded"
                  >
                    <span className="font-medium">{m.animalName}</span>
                    <span>{m.quantity} kg</span>
                  </div>
                ))}
              </div>
            )}

            {/* Unmatched warning */}
            {unmatched.length > 0 && (
              <Alert className="border-yellow-200 bg-yellow-50 text-yellow-900">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800 text-xs">
                  {unmatched.length} registros sin coincidencia:{" "}
                  {unmatched.map((u) => u.codigo).join(", ")}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleClose}>
                {t("milk.cancelLabel")}
              </Button>
              {matched.length > 0 && (
                <Button onClick={handleImport}>
                  Importar {matched.length} registros
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
