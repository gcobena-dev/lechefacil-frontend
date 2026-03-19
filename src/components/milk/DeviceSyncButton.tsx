import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
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
  inputUnit: string;
  density: number;
  date: string;
}

export default function DeviceSyncButton({
  onResultsProcessed,
  disabled,
  inputUnit,
  density,
  date,
}: DeviceSyncButtonProps) {
  const { t } = useTranslation();
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={disabled}
        onClick={() => setWizardOpen(true)}
      >
        <Download className="h-4 w-4 mr-2" />
        Importar desde Balanza
      </Button>

      <DeviceSyncWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onResultsProcessed={onResultsProcessed}
        inputUnit={inputUnit}
        density={density}
        date={date}
      />
    </>
  );
}
