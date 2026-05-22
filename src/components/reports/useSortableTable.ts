import { useMemo, useState } from "react";

export type SortDirection = "asc" | "desc";

/**
 * Generic comparator: numbers compared numerically, everything else as
 * locale-aware strings (with numeric collation so "10" sorts after "9").
 * Nullish values are always pushed to the end.
 */
export function compareValues(a: unknown, b: unknown): number {
  const aEmpty = a === null || a === undefined || a === "";
  const bEmpty = b === null || b === undefined || b === "";
  if (aEmpty && bEmpty) return 0;
  if (aEmpty) return 1;
  if (bEmpty) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

/**
 * Sortable-table state for a plain HTML table.
 *
 * Clicking a new column sorts it ascending; clicking the active column
 * toggles between ascending and descending.
 *
 * @param rows      the data rows to sort
 * @param getValue  maps a row + column key to the comparable value
 * @param initialKey  column sorted on first render
 * @param initialDir  direction on first render (default "desc")
 */
export function useSortableTable<T, K extends string>(
  rows: T[],
  getValue: (row: T, key: K) => unknown,
  initialKey: K,
  initialDir: SortDirection = "desc",
) {
  const [sortKey, setSortKey] = useState<K>(initialKey);
  const [sortDir, setSortDir] = useState<SortDirection>(initialDir);

  const toggleSort = (key: K) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedRows = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const cmp = compareValues(getValue(a, sortKey), getValue(b, sortKey));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, getValue, sortKey, sortDir]);

  return { sortedRows, sortKey, sortDir, toggleSort };
}
