import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle } from "lucide-react";
import { convertToLiters } from "@/lib/mock-data";
import { useTranslation } from "@/hooks/useTranslation";

interface Animal {
  id: string;
  name: string;
  tag: string;
}

interface BulkAnimalSelectionProps {
  animals: Animal[];
  selectedAnimals: string[];
  animalQuantities: Record<string, string>;
  inputUnit: string;
  density: string;
  onToggleSelection: (animalId: string) => void;
  onUpdateQuantity: (animalId: string, quantity: string) => void;
}

export default function BulkAnimalSelection({
  animals,
  selectedAnimals,
  animalQuantities,
  inputUnit,
  density,
  onToggleSelection,
  onUpdateQuantity
}: BulkAnimalSelectionProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <Label>{t("milk.selectAnimalsAndQuantities")}</Label>
      <div className="space-y-3 max-h-96 overflow-y-auto p-4 border rounded">
        {animals.map((animal) => (
          <div
            key={animal.id}
            className={`p-3 border rounded ${
              selectedAnimals.includes(animal.id)
                ? 'bg-primary/10 border-primary'
                : 'hover:bg-muted'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div
                className="flex items-center gap-2 cursor-pointer flex-1"
                onClick={() => onToggleSelection(animal.id)}
              >
                <div className={`w-4 h-4 border-2 rounded ${
                  selectedAnimals.includes(animal.id)
                    ? 'bg-primary border-primary'
                    : 'border-muted-foreground'
                }`}>
                  {selectedAnimals.includes(animal.id) && (
                    <CheckCircle className="w-4 h-4 text-primary-foreground -m-0.5" />
                  )}
                </div>
                <span className="font-medium">{animal.tag} - {animal.name}</span>
              </div>
            </div>

            {selectedAnimals.includes(animal.id) && (
              <div className="flex items-center gap-2 mt-2">
                <Input
                  type="number"
                  step="0.1"
                  min={0}
                  placeholder={t("common.quantity")}
                  value={animalQuantities[animal.id] || ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "") return onUpdateQuantity(animal.id, v);
                    const n = parseFloat(v);
                    onUpdateQuantity(animal.id, (isNaN(n) || n < 0) ? "0" : v);
                  }}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground min-w-[60px]">
                  {animalQuantities[animal.id] ? (
                    <>
                      {convertToLiters(
                        parseFloat(animalQuantities[animal.id]),
                        inputUnit as any,
                        parseFloat(density)
                      ).toFixed(1)}L
                    </>
                  ) : (
                    '0L'
                  )}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        {selectedAnimals.length} {t("milk.animalsSelected")}
      </p>
    </div>
  );
}