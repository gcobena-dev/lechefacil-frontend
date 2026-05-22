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
import { useTechnicians } from "@/hooks/useReproduction";
import { getLabelSuggestions } from "@/services/animals";
import type { ReproductiveBucket } from "@/services/reproductionDashboard";

/**
 * Attribute filter state for the reproductive-animals table. Every filter is
 * modelled as a string array so the UI can stay uniform; `heat_detected` uses
 * the values "true" / "false" and is converted to a boolean before the request.
 */
export interface ReproFilterState {
  alert_level: string[];
  method: string[];
  pregnancy_status: string[];
  technician: string[];
  heat_detected: string[];
  last_event_type: string[];
  labels: string[];
}

export const EMPTY_REPRO_FILTERS: ReproFilterState = {
  alert_level: [],
  method: [],
  pregnancy_status: [],
  technician: [],
  heat_detected: [],
  last_event_type: [],
  labels: [],
};

type FilterKey = keyof ReproFilterState;

/** Number of filters that currently have at least one value selected. */
export function countActiveFilters(f: ReproFilterState): number {
  return (Object.keys(f) as FilterKey[]).reduce(
    (n, k) => n + (f[k].length > 0 ? 1 : 0),
    0,
  );
}

// Which filters are shown by default vs. behind "Más filtros", per tab.
// Filters that are constant within a tab (e.g. result on the "Inseminadas"
// tab — always pending) are omitted so the controls stay meaningful.
function tabFilters(bucket: ReproductiveBucket): {
  defaults: FilterKey[];
  more: FilterKey[];
} {
  switch (bucket) {
    case "prenadas":
      return {
        defaults: ["method"],
        more: ["labels", "technician", "heat_detected", "last_event_type"],
      };
    case "inseminadas":
      return {
        defaults: ["alert_level", "method"],
        more: ["labels", "technician", "heat_detected", "last_event_type"],
      };
    case "sin_inseminar":
      return { defaults: ["alert_level"], more: ["labels", "last_event_type"] };
    case "vacias":
    case "alertas":
    case "todas":
    default:
      return {
        defaults: ["alert_level", "method", "pregnancy_status"],
        more: ["labels", "technician", "heat_detected", "last_event_type"],
      };
  }
}

interface Props {
  bucket: ReproductiveBucket;
  filters: ReproFilterState;
  onChange: (next: ReproFilterState) => void;
}

export default function ReproductiveAnimalsFilters({
  bucket,
  filters,
  onChange,
}: Props) {
  const { t } = useTranslation();
  const { data: technicians = [] } = useTechnicians();
  const { data: animalLabels = [] } = useQuery({
    queryKey: ["all-labels"],
    queryFn: () => getLabelSuggestions(""),
    staleTime: 5 * 60 * 1000,
  });
  const [showMore, setShowMore] = useState(false);

  const { defaults, more } = tabFilters(bucket);
  const activeCount = countActiveFilters(filters);
  const hasActiveMore = more.some((k) => filters[k].length > 0);
  const expanded = showMore || hasActiveMore;
  const visibleKeys = expanded ? [...defaults, ...more] : defaults;

  const setKey = (key: FilterKey, value: string[]) => {
    onChange({ ...filters, [key]: value });
  };

  const labelFor = (key: FilterKey): string => {
    switch (key) {
      case "alert_level":
        return t("reproduction.filterAlertLevel");
      case "method":
        return t("reproduction.filterMethod");
      case "pregnancy_status":
        return t("reproduction.filterResult");
      case "technician":
        return t("reproduction.filterTechnician");
      case "heat_detected":
        return t("reproduction.filterHeat");
      case "last_event_type":
        return t("reproduction.filterLastEvent");
      case "labels":
        return t("reproduction.filterLabels");
    }
  };

  const optionsFor = (key: FilterKey): { value: string; label: string }[] => {
    switch (key) {
      case "alert_level":
        return [
          { value: "optimal", label: t("reproduction.stateOptimal") },
          { value: "warning", label: t("reproduction.stateWarning") },
          { value: "critical", label: t("reproduction.stateCritical") },
        ];
      case "method":
        return [
          { value: "AI", label: t("reproduction.methodAI") },
          { value: "NATURAL", label: t("reproduction.methodNATURAL") },
          { value: "IATF", label: t("reproduction.methodIATF") },
          { value: "ET", label: t("reproduction.methodET") },
        ];
      case "pregnancy_status": {
        const all = [
          { value: "PENDING", label: t("reproduction.pending") },
          { value: "CONFIRMED", label: t("reproduction.confirmed") },
          { value: "OPEN", label: t("reproduction.open") },
          { value: "LOST", label: t("reproduction.lost") },
        ];
        // On the "Vacías" tab only OPEN/LOST rows exist.
        return bucket === "vacias"
          ? all.filter((o) => o.value === "OPEN" || o.value === "LOST")
          : all;
      }
      case "technician":
        return technicians.map((tech) => ({ value: tech, label: tech }));
      case "heat_detected":
        return [
          { value: "true", label: t("reproduction.heatYes") },
          { value: "false", label: t("reproduction.heatNo") },
        ];
      case "last_event_type":
        return [
          { value: "calving", label: t("reproduction.eventCalving") },
          { value: "insemination", label: t("reproduction.eventInsemination") },
          { value: "check", label: t("reproduction.eventCheck") },
        ];
      case "labels":
        return animalLabels.map((label) => ({ value: label, label }));
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
            className={`h-8 gap-1.5 ${
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
              {t("reproduction.filterNoOptions")}
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
              {t("reproduction.filterClearOne")}
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
        {t("reproduction.filters")}
      </span>

      {visibleKeys.map((key) => renderDropdown(key))}

      {more.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs text-muted-foreground"
          onClick={() => setShowMore((v) => !v)}
        >
          {expanded
            ? t("reproduction.filtersLess")
            : t("reproduction.filtersMore")}
        </Button>
      )}

      {activeCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs text-muted-foreground"
          onClick={() => onChange(EMPTY_REPRO_FILTERS)}
        >
          <X className="mr-1 h-3.5 w-3.5" />
          {t("reproduction.filtersClear")} ({activeCount})
        </Button>
      )}
    </div>
  );
}
