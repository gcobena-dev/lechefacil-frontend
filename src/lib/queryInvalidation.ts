import type { QueryClient } from "@tanstack/react-query";

/**
 * Cache roots to drop after a write, grouped by what a write actually changes.
 *
 * The app spreads one record over several independent query roots — the paged
 * list, the detail the edit form reads its `version` from, the report variants,
 * the dashboard counters — and react-query matches keys by prefix, so each root
 * has to be named. Invalidating one and forgetting the rest is what made saves
 * look like they had not been applied: with a 5 minute `staleTime` over a cache
 * persisted to IndexedDB, the untouched roots kept serving the pre-write copy,
 * and the stale `version` in them came back as a 409 on the next save.
 */

const ANIMAL_ROOTS = [
  "animals",
  "animals-list",
  "animals-list-all",
  "animals-by-id",
  "animal",
  "animal-detail",
  "animal-photos",
  "animal-certificate",
  "animal-events",
  "animal-lactations",
  "reproductive-animals",
  "all-labels",
  // Head counts and status breakdowns are derived from the animals themselves.
  "dashboard",
];

const HEALTH_ROOTS = [
  // The list is keyed "health-records" and the forms used to invalidate
  // "healthRecords" — different roots, so the list never refreshed. Both are
  // listed here so neither spelling can go stale again.
  "health-records",
  "healthRecords",
  "healthRecord",
];

const MILK_ROOTS = [
  "milk-productions",
  "milk-deliveries",
  "animal-production-paged",
  // Litres of the day, top producers and progress all read the same records.
  "dashboard",
  "reports",
];

const REPRODUCTION_ROOTS = [
  "inseminations",
  "pending-checks",
  "reproduction-kpis",
  "sires",
  "semen-stock",
  "semen-autocomplete",
  "insemination-technicians",
];

function invalidateRoots(queryClient: QueryClient, roots: string[]): Promise<void> {
  return Promise.all(
    roots.map((root) => queryClient.invalidateQueries({ queryKey: [root] }))
  ).then(() => undefined);
}

/**
 * Drops every cached view of the animals.
 *
 * Awaiting it is optional: the point is to mark the roots stale before the user
 * can navigate back into the form, not to block the redirect on a refetch.
 */
export function invalidateAnimalQueries(queryClient: QueryClient): Promise<void> {
  return invalidateRoots(queryClient, ANIMAL_ROOTS);
}

/** A health record can move the animal's status and milk withdrawal with it. */
export function invalidateHealthQueries(queryClient: QueryClient): Promise<void> {
  return invalidateRoots(queryClient, [...HEALTH_ROOTS, ...ANIMAL_ROOTS]);
}

/** Milk records feed the collection screens, the animal tab and the dashboard. */
export function invalidateMilkQueries(queryClient: QueryClient): Promise<void> {
  return invalidateRoots(queryClient, [...MILK_ROOTS, "animal-detail", "animal-lactations"]);
}

/** Services and pregnancy checks change the animal's reproductive status. */
export function invalidateReproductionQueries(queryClient: QueryClient): Promise<void> {
  return invalidateRoots(queryClient, [...REPRODUCTION_ROOTS, ...ANIMAL_ROOTS]);
}
