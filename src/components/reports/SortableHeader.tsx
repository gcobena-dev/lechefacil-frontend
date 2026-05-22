import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import type { SortDirection } from "./useSortableTable";

interface Props {
  /** Visible column label. */
  label: string;
  /** Identifier for this column, passed to onSort. */
  sortKey: string;
  /** Currently sorted column. */
  activeKey: string;
  /** Direction of the active column. */
  direction: SortDirection;
  onSort: (key: string) => void;
  align?: "left" | "right" | "center";
  className?: string;
}

/**
 * A `<th>` whose label is a button that toggles sorting for its column.
 * Shows a neutral icon when inactive and an up/down arrow when it is the
 * active sort column.
 */
export default function SortableHeader({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
  align = "left",
  className = "",
}: Props) {
  const { t } = useTranslation();
  const isActive = activeKey === sortKey;
  const alignClass =
    align === "right"
      ? "text-right"
      : align === "center"
        ? "text-center"
        : "text-left";
  const justifyClass =
    align === "right"
      ? "justify-end"
      : align === "center"
        ? "justify-center"
        : "justify-start";

  const Icon = !isActive ? ArrowUpDown : direction === "asc" ? ArrowUp : ArrowDown;
  const dirLabel = isActive
    ? direction === "asc"
      ? t("reports.sortedAscending")
      : t("reports.sortedDescending")
    : "";

  return (
    <th className={`border border-border p-2 ${alignClass} ${className}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        title={`${t("reports.sortByColumn")}${dirLabel ? ` · ${dirLabel}` : ""}`}
        aria-label={`${label} — ${t("reports.sortByColumn")}`}
        className={`inline-flex w-full items-center gap-1 ${justifyClass} font-semibold transition-colors hover:text-primary ${
          isActive ? "text-primary" : ""
        }`}
      >
        <span>{label}</span>
        <Icon
          className={`h-3.5 w-3.5 shrink-0 ${isActive ? "" : "opacity-40"}`}
        />
      </button>
    </th>
  );
}
