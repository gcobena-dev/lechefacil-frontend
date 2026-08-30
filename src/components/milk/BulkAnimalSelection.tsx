import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, Search, X } from "lucide-react";
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

/**
 * One row per animal, in a single continuous list.
 *
 * The previous version nested a 384px scroll box inside the page and paged 10
 * at a time, so on a phone you scrolled the page, hit a second scroll area, saw
 * three animals at once and had to tap through pages to reach the rest. Rows
 * are now ~52px instead of ~120px and the page owns the only scrollbar.
 */
export default function BulkAnimalSelection({
  animals,
  selectedAnimals,
  animalQuantities,
  inputUnit,
  density,
  onToggleSelection,
  onUpdateQuantity,
}: BulkAnimalSelectionProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  // Client-side: the whole lactating list is already in memory, so filtering
  // costs nothing and keeps working with no connection.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return animals;
    return animals.filter(
      (a) =>
        a.name?.toLowerCase().includes(q) || a.tag?.toLowerCase().includes(q)
    );
  }, [animals, search]);

  const litersOf = (raw: string) =>
    convertToLiters(parseFloat(raw), inputUnit as never, parseFloat(density));

  const { withValue, totalLiters } = useMemo(() => {
    let count = 0;
    let liters = 0;
    for (const id of selectedAnimals) {
      const raw = animalQuantities[id];
      if (raw !== undefined && raw !== "" && !isNaN(parseFloat(raw))) {
        count += 1;
        liters += litersOf(raw);
      }
    }
    return { withValue: count, totalLiters: liters };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAnimals, animalQuantities, inputUnit, density]);

  const unitLabel = inputUnit?.toUpperCase() === "L" ? "L" : inputUnit;
  const showsConversion = inputUnit?.toUpperCase() !== "L";

  return (
    <div className="space-y-3">
      {/* Progress: what is entered so far, without scrolling to the summary */}
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <span className="font-medium">
          {t("milk.selectAnimalsAndQuantities")}
        </span>
        <span className="text-sm text-muted-foreground tabular-nums">
          {t("milk.withValueOfTotal", {
            withValue,
            total: selectedAnimals.length,
          })}{" "}
          · {totalLiters.toFixed(1)} L
        </span>
      </div>

      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("common.searchByNameOrTag")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 pr-8"
        />
        {search && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-9 w-9"
            onClick={() => setSearch("")}
            aria-label={t("common.clear")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* No inner scroll container: the page provides the only scrollbar. */}
      <div className="rounded-md border divide-y divide-border">
        {filtered.map((animal) => {
          const isSelected = selectedAnimals.includes(animal.id);
          const raw = animalQuantities[animal.id] ?? "";
          const hasValue = raw !== "" && !isNaN(parseFloat(raw));
          return (
            <div
              key={animal.id}
              className={`flex items-center gap-1.5 px-1.5 py-1.5 ${
                isSelected ? "" : "opacity-55"
              }`}
            >
              <button
                type="button"
                onClick={() => onToggleSelection(animal.id)}
                aria-pressed={isSelected}
                aria-label={`${animal.tag} ${animal.name}`}
                className={`h-6 w-6 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                  isSelected
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-muted-foreground/50"
                }`}
              >
                {isSelected && <Check className="h-4 w-4" strokeWidth={3} />}
              </button>

              {/* `min-w-0` + a flex child is what actually makes `truncate`
                  work: without it a long name refuses to shrink and shoves the
                  quantity input off the edge of the phone. */}
              <button
                type="button"
                onClick={() => onToggleSelection(animal.id)}
                className="min-w-0 flex-1 flex items-baseline gap-1.5 text-left"
                title={`${animal.tag} ${animal.name}`}
              >
                <span className="font-mono text-xs text-muted-foreground shrink-0">
                  {animal.tag}
                </span>
                <span className="text-sm truncate">{animal.name}</span>
              </button>

              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min={0}
                disabled={!isSelected}
                placeholder="0"
                value={raw}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") return onUpdateQuantity(animal.id, v);
                  const n = parseFloat(v);
                  onUpdateQuantity(animal.id, isNaN(n) || n < 0 ? "0" : v);
                }}
                className={`w-16 h-9 px-2 text-right shrink-0 tabular-nums ${
                  hasValue ? "border-primary/60" : ""
                }`}
              />
              <span className="w-5 shrink-0 text-xs text-muted-foreground">
                {unitLabel}
              </span>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-sm">
            {search ? t("common.noResults") : t("common.noAnimalsAvailable")}
          </div>
        )}
      </div>

      {/* Only meaningful when the entered unit is not litres */}
      {showsConversion && totalLiters > 0 && (
        <p className="text-xs text-muted-foreground text-right">
          ≈ {totalLiters.toFixed(1)} L
        </p>
      )}

      {search && (
        <p className="text-xs text-muted-foreground">
          {t("common.showingFiltered", {
            shown: filtered.length,
            total: animals.length,
          })}
        </p>
      )}
    </div>
  );
}
