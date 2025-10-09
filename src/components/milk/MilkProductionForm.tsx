import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calculator, CheckCircle, ChevronDown, SlidersHorizontal } from "lucide-react";
import { convertToLiters } from "@/lib/mock-data";
import { getTodayLocalDateString } from "@/utils/dateUtils";
import { useTranslation } from "@/hooks/useTranslation";
import BulkAnimalSelection from "./BulkAnimalSelection";
import SearchableAnimalSelect from "./SearchableAnimalSelect";
import ConfigurationInfo from "./ConfigurationInfo";
import OcrPhotoUpload from "./OcrPhotoUpload";
import type { MilkCollectionFormData } from "@/hooks/useMilkCollectionForm";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Animal {
  id: string;
  name: string;
  tag: string;
}

interface Buyer {
  id: string;
  name: string;
}

interface MilkProductionFormProps {
  formData: MilkCollectionFormData;
  isBulkMode: boolean;
  selectedAnimals: string[];
  animalQuantities: Record<string, string>;
  activeAnimals: Animal[];
  buyers: Buyer[];
  effectivePrice?: number;
  creating: boolean;
  creatingBulk: boolean;
  onFormDataChange: (data: Partial<MilkCollectionFormData>) => void;
  onBulkModeChange: (isBulk: boolean) => void;
  onToggleAnimalSelection: (animalId: string) => void;
  onUpdateAnimalQuantity: (animalId: string, quantity: string) => void;
  onSubmit: () => void;
  ocrResetKey?: string | number;
}

interface OcrResult {
  animalId: string | null;
  animalName: string;
  liters: number;
  matchConfidence: number;
  extractedName: string;
  suggestions?: Array<{ animalId: string; name: string; similarity: number }>;
}

export default function MilkProductionForm({
  formData,
  isBulkMode,
  selectedAnimals,
  animalQuantities,
  activeAnimals,
  buyers,
  effectivePrice,
  creating,
  creatingBulk,
  onFormDataChange,
  onBulkModeChange,
  onToggleAnimalSelection,
  onUpdateAnimalQuantity,
  onSubmit,
  ocrResetKey
}: MilkProductionFormProps) {
  const { t } = useTranslation();
  const todayStr = getTodayLocalDateString();

  const calculatedLiters = formData.inputValue ?
    convertToLiters(parseFloat(formData.inputValue), formData.inputUnit as any, parseFloat(formData.density)) : 0;

  const bulkCalculatedTotal = Object.values(animalQuantities).reduce((sum, quantity) => {
    return sum + (quantity ? convertToLiters(parseFloat(quantity), formData.inputUnit as any, parseFloat(formData.density)) : 0);
  }, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const handleOcrResults = (results: OcrResult[]) => {
    // Auto-fill quantities based on OCR results
    results.forEach((result) => {
      if (result.animalId && result.matchConfidence > 0.7) {
        // Only auto-fill if confidence is high enough
        // Convert liters to the current input unit
        const quantity = result.liters.toString();
        onUpdateAnimalQuantity(result.animalId, quantity);

        // Ensure animal is selected
        if (!selectedAnimals.includes(result.animalId)) {
          onToggleAnimalSelection(result.animalId);
        }
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("milk.milkingData")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Mode Toggle */}
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <Label htmlFor="bulkMode">{t("milk.registrationMode")}</Label>
            <div className="flex items-center gap-2">
              <span className={!isBulkMode ? "font-medium" : ""}>{t("milk.individual")}</span>
              <Switch
                id="bulkMode"
                checked={isBulkMode}
                onCheckedChange={onBulkModeChange}
              />
              <span className={isBulkMode ? "font-medium" : ""}>{t("milk.bulk")}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date">{t("common.date")}</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => onFormDataChange({ date: e.target.value })}
                  onClick={(e) => e.currentTarget.showPicker?.()}
                  max={todayStr}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shift">{t("milk.shift")}</Label>
                <Select value={formData.shift} onValueChange={(value) => onFormDataChange({ shift: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM">{t("milk.morning")}</SelectItem>
                    <SelectItem value="PM">{t("milk.evening")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!isBulkMode ? (
              /* Individual Mode */
              <div className="space-y-2">
                <Label htmlFor="animal">{t("milk.animal")}</Label>
                <SearchableAnimalSelect
                  animals={activeAnimals}
                  value={formData.animalId}
                  onValueChange={(value) => onFormDataChange({ animalId: value })}
                  placeholder={t("common.selectAnimal")}
                />
              </div>
            ) : (
              /* Bulk Mode */
              <div className="space-y-4">
                {/* OCR Photo Upload */}
                <OcrPhotoUpload
                  key={String(ocrResetKey ?? '')}
                  onResultsProcessed={handleOcrResults}
                  disabled={creating || creatingBulk}
                  resetKey={ocrResetKey}
                />

                {/* Bulk Animal Selection */}
                <BulkAnimalSelection
                  animals={activeAnimals}
                  selectedAnimals={selectedAnimals}
                  animalQuantities={animalQuantities}
                  inputUnit={formData.inputUnit}
                  density={formData.density}
                  onToggleSelection={onToggleAnimalSelection}
                  onUpdateQuantity={onUpdateAnimalQuantity}
                />
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              {!isBulkMode && (
                <div className="space-y-2">
                  <Label htmlFor="inputValue">{t("common.quantity")}</Label>
                  <Input
                    id="inputValue"
                    type="number"
                    step="0.1"
                    min={0}
                    value={formData.inputValue}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "") return onFormDataChange({ inputValue: v });
                      const n = parseFloat(v);
                      onFormDataChange({ inputValue: (isNaN(n) || n < 0) ? "0" : v });
                    }}
                    placeholder="15.5"
                    required
                  />
                </div>
              )}

              {/* Desktop (md+) secondary info always visible */}
              <div className="hidden md:block md:col-span-2">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>{t("milk.pricePerLiter")}</Label>
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium">
                        {effectivePrice !== undefined ? `$${effectivePrice.toFixed(2)}` : t('milk.notConfigured')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("milk.unit")}</Label>
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium">
                        {formData.inputUnit === 'L' ? t('milk.litersL') : formData.inputUnit === 'KG' ? t('milk.kilogramsKG') : t('milk.poundsLB')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("milk.density")}</Label>
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium">{formData.density} (kg/m³)</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Desktop (md+) buyer in remaining column when bulk mode (fills the empty spot) */}
              {isBulkMode && (
                <div className="hidden md:block">
                  <div className="space-y-2">
                    <Label>{t("milk.buyerText")}</Label>
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium">
                        {formData.buyerId ? buyers.find(b => b.id === formData.buyerId)?.name || t('milk.notFound') : t('milk.notConfigured')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {((!isBulkMode && formData.inputValue) || (isBulkMode && bulkCalculatedTotal > 0)) && (
              <Card className="bg-accent/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Calculator className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{t("milk.automaticConversion")}</p>
                      {!isBulkMode ? (
                        <p className="text-sm text-muted-foreground">
                          {formData.inputValue} {formData.inputUnit} =
                          <span className="font-medium text-primary ml-1">
                            {calculatedLiters.toFixed(2)} Litros
                          </span>
                        </p>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          <p>
                            <span className="font-medium text-primary">
                              {t("milk.total")}: {bulkCalculatedTotal.toFixed(2)} Litros
                            </span>
                          </p>
                          <p className="text-xs mt-1">
                            {Object.entries(animalQuantities).filter(([_, quantity]) => quantity).length} {t("milk.animalsWithProduction")}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Mobile (sm) collapsible for secondary fields */}
            <div className="md:hidden">
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <SlidersHorizontal className="h-4 w-4" /> {t('milk.additionalOptions')}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-70" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label>{t("milk.pricePerLiter")}</Label>
                      <div className="p-3 bg-muted rounded-md">
                        <p className="text-sm font-medium">
                          {effectivePrice !== undefined ? `$${effectivePrice.toFixed(2)}` : t('milk.notConfigured')}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("milk.unit")}</Label>
                      <div className="p-3 bg-muted rounded-md">
                        <p className="text-sm font-medium">
                          {formData.inputUnit === 'L' ? t('milk.litersL') : formData.inputUnit === 'KG' ? t('milk.kilogramsKG') : t('milk.poundsLB')}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("milk.density")}</Label>
                      <div className="p-3 bg-muted rounded-md">
                        <p className="text-sm font-medium">{formData.density} (kg/m³)</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("milk.buyerText")}</Label>
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium">
                        {formData.buyerId ? buyers.find(b => b.id === formData.buyerId)?.name || t('milk.notFound') : t('milk.notConfigured')}
                      </p>
                    </div>
                  </div>

                  <ConfigurationInfo />

                  <div className="space-y-2">
                    <Label htmlFor="notes">{t("milk.optionalNotes")}</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => onFormDataChange({ notes: e.target.value })}
                      placeholder={t("common.milkingNotes")}
                      rows={2}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Desktop (md+) buyer, config info and notes */}
            <div className="hidden md:block space-y-4">
              {!isBulkMode && (
                <div className="space-y-2">
                  <Label>{t("milk.buyerText")}</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm font-medium">
                      {formData.buyerId ? buyers.find(b => b.id === formData.buyerId)?.name || t('milk.notFound') : t('milk.notConfigured')}
                    </p>
                  </div>
                </div>
              )}

              <ConfigurationInfo />

              <div className="space-y-2">
                <Label htmlFor="notes">{t("milk.optionalNotes")}</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => onFormDataChange({ notes: e.target.value })}
                  placeholder={t("common.milkingNotes")}
                  rows={2}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={creating || creatingBulk}>
              <CheckCircle className="w-4 h-4 mr-2" />
              {isBulkMode ? t('milk.registerBulkProduction') : (creating ? t('milk.saving') : t('milk.registerMilking'))}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
