import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CheckCircle, Search, ChevronLeft, ChevronRight } from "lucide-react";
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
  // Optional server-side pagination props
  currentPage?: number;
  pageSize?: number;
  totalItems?: number | null;
  onPageChange?: (page: number) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export default function BulkAnimalSelection({
  animals,
  selectedAnimals,
  animalQuantities,
  inputUnit,
  density,
  onToggleSelection,
  onUpdateQuantity,
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  searchQuery,
  onSearchChange,
}: BulkAnimalSelectionProps) {
  const { t } = useTranslation();
  const [localSearch, setLocalSearch] = useState("");
  const [localPage, setLocalPage] = useState(1);
  const itemsPerPage = pageSize ?? 10;
  const isServerPaginated = typeof onPageChange === 'function';

  // Filter animals based on search query
  const effectiveSearch = isServerPaginated ? (searchQuery ?? "") : localSearch;
  const filteredAnimals = useMemo(() => {
    if (isServerPaginated) return animals; // server already filtered
    if (!effectiveSearch.trim()) return animals;
    const query = effectiveSearch.toLowerCase();
    return animals.filter(animal =>
      animal.name.toLowerCase().includes(query) ||
      animal.tag.toLowerCase().includes(query)
    );
  }, [animals, effectiveSearch, isServerPaginated]);

  // Calculate pagination
  const totalItemsCount = isServerPaginated ? (totalItems ?? filteredAnimals.length) : filteredAnimals.length;
  const totalPages = Math.max(1, Math.ceil(totalItemsCount / itemsPerPage));
  const currentPg = isServerPaginated ? (currentPage ?? 1) : localPage;
  const startIndex = (currentPg - 1) * itemsPerPage;
  const paginatedAnimals = isServerPaginated ? animals : filteredAnimals.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when search changes
  useMemo(() => {
    if (isServerPaginated) {
      onPageChange?.(1);
    } else {
      setLocalPage(1);
    }
  }, [effectiveSearch]);

  return (
    <div className="space-y-4">
      <Label>{t("milk.selectAnimalsAndQuantities")}</Label>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("common.searchByNameOrTag")}
          value={isServerPaginated ? (searchQuery ?? "") : localSearch}
          onChange={(e) => {
            const v = e.target.value;
            if (isServerPaginated) {
              onSearchChange?.(v);
            } else {
              setLocalSearch(v);
            }
          }}
          className="pl-8"
        />
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto p-4 border rounded">
        {paginatedAnimals.map((animal) => (
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
                  step="0.01"
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
                      ).toFixed(2)}L
                    </>
                  ) : (
                    '0L'
                  )}
                </span>
              </div>
            )}
          </div>
        ))}

        {paginatedAnimals.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            {effectiveSearch ? t("common.noResults") : t("common.noAnimalsAvailable")}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {t("common.showingResults", {
              start: startIndex + 1,
              end: Math.min(startIndex + itemsPerPage, totalItemsCount),
              total: totalItemsCount
            })}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => isServerPaginated ? onPageChange?.(Math.max(1, currentPg - 1)) : setLocalPage(p => Math.max(1, p - 1))}
              disabled={currentPg === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentPg} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => isServerPaginated ? onPageChange?.(Math.min(totalPages, currentPg + 1)) : setLocalPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPg === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        {selectedAnimals.length} {t("milk.animalsSelected")}
      </p>
    </div>
  );
}
