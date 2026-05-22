import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { getAnimalStatuses, getLabelSuggestions } from "@/services/animals";
import { getLots } from "@/services/lots";
import { getBreeds } from "@/services/breeds";

/**
 * Filter state for the animals list. Every filter is a string array so the
 * UI stays uniform; `in_milk_withdrawal` uses the values "true" / "false"
 * and is converted to a boolean before the request.
 */
export interface AnimalFilterState {
  status: string[]; // status codes
  sex: string[]; // FEMALE | MALE
  labels: string[];
  in_milk_withdrawal: string[];
  lot: string[]; // lot ids
  breed: string[]; // breed ids
}

export const EMPTY_ANIMAL_FILTERS: AnimalFilterState = {
  status: [],
  sex: [],
  labels: [],
  in_milk_withdrawal: [],
  lot: [],
  breed: [],
};

type FilterKey = keyof AnimalFilterState;

/** Number of filters with at least one value selected. */
export function countActiveAnimalFilters(f: AnimalFilterState): number {
  return (Object.keys(f) as FilterKey[]).reduce(
    (n, k) => n + (f[k].length > 0 ? 1 : 0),
    0,
  );
}

const DEFAULT_KEYS: FilterKey[] = [
  "status",
  "sex",
  "labels",
  "in_milk_withdrawal",
];
const MORE_KEYS: FilterKey[] = ["lot", "breed"];

interface Props {
  filters: AnimalFilterState;
  onChange: (next: AnimalFilterState) => void;
}

export default function AnimalsFilters({ filters, onChange }: Props) {
  const { t } = useTranslation();
  const [showMore, setShowMore] = useState(false);

  const { data: statuses = [] } = useQuery({
    queryKey: ["animal-statuses"],
    queryFn: () => getAnimalStatuses("es"),
    staleTime: 5 * 60 * 1000,
  });
  const { data: lots = [] } = useQuery({
    queryKey: ["lots", { active: true }],
    queryFn: () => getLots({ active: true }),
    staleTime: 5 * 60 * 1000,
  });
  const { data: breeds = [] } = useQuery({
    queryKey: ["breeds"],
    queryFn: () => getBreeds(),
    staleTime: 5 * 60 * 1000,
  });
  const { data: labels = [] } = useQuery({
    queryKey: ["all-labels"],
    queryFn: () => getLabelSuggestions(""),
    staleTime: 5 * 60 * 1000,
  });

  const activeCount = countActiveAnimalFilters(filters);
  const hasActiveMore = MORE_KEYS.some((k) => filters[k].length > 0);
  const expanded = showMore || hasActiveMore;
  const visibleKeys = expanded ? [...DEFAULT_KEYS, ...MORE_KEYS] : DEFAULT_KEYS;

  const setKey = (key: FilterKey, value: string[]) => {
    onChange({ ...filters, [key]: value });
  };

  const labelFor = (key: FilterKey): string => {
    switch (key) {
      case "status":
        return t("animals.filterStatus");
      case "sex":
        return t("animals.filterSex");
      case "labels":
        return t("animals.filterLabels");
      case "in_milk_withdrawal":
        return t("animals.filterWithdrawal");
      case "lot":
        return t("animals.filterLot");
      case "breed":
        return t("animals.filterBreed");
    }
  };

  const optionsFor = (key: FilterKey): { value: string; label: string }[] => {
    switch (key) {
      case "status":
        return statuses.map((s) => ({ value: s.code, label: s.name }));
      case "sex":
        return [
          { value: "FEMALE", label: t("animals.female") },
          { value: "MALE", label: t("animals.male") },
        ];
      case "labels":
        return labels.map((l) => ({ value: l, label: l }));
      case "in_milk_withdrawal":
        return [
          { value: "true", label: t("animals.withdrawalActive") },
          { value: "false", label: t("animals.withdrawalNone") },
        ];
      case "lot":
        return lots.map((l) => ({ value: l.id, label: l.name }));
      case "breed":
        return breeds.map((b) => ({ value: b.id, label: b.name }));
    }
  };

  const renderDropdown = (key: FilterKey) => {
    const selected = filters[key];
    const options = optionsFor(key);
    const toggle = (value: string) => {
      setKey(
        key,
        selected.includes(value)
          ? selected.filter((v) => v !== value)
          : [...selected, value],
      );
    };

    return (
      <Popover key={key}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`h-9 gap-1.5 ${
              selected.length
                ? "border-primary/60 text-foreground"
                : "text-muted-foreground"
            }`}
          >
            <span>{labelFor(key)}</span>
            {selected.length > 0 && (
              <span className="rounded bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                {selected.length}
              </span>
            )}
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-56 p-2">
          {options.length === 0 ? (
            <p className="px-2 py-3 text-xs text-muted-foreground">
              {t("animals.filterNoOptions")}
            </p>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {options.map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
                >
                  <Checkbox
                    checked={selected.includes(opt.value)}
                    onCheckedChange={() => toggle(opt.value)}
                  />
                  <span className="truncate">{opt.label}</span>
                </label>
              ))}
            </div>
          )}
          {selected.length > 0 && (
            <button
              type="button"
              className="mt-1 w-full rounded px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-muted"
              onClick={() => setKey(key, [])}
            >
              {t("animals.filterClearOne")}
            </button>
          )}
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-0.5 hidden items-center text-xs text-muted-foreground sm:inline-flex">
        <SlidersHorizontal className="mr-1 h-3.5 w-3.5" />
        {t("animals.filters")}
      </span>

      {visibleKeys.map((key) => renderDropdown(key))}

      <Button
        variant="ghost"
        size="sm"
        className="h-9 px-2 text-xs text-muted-foreground"
        onClick={() => setShowMore((v) => !v)}
      >
        {expanded ? t("animals.filtersLess") : t("animals.filtersMore")}
      </Button>

      {activeCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-2 text-xs text-muted-foreground"
          onClick={() => onChange(EMPTY_ANIMAL_FILTERS)}
        >
          <X className="mr-1 h-3.5 w-3.5" />
          {t("animals.filtersClear")} ({activeCount})
        </Button>
      )}
    </div>
  );
}
