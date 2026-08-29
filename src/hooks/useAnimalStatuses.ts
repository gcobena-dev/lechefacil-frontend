import { useQuery } from "@tanstack/react-query";
import { getAnimalStatuses } from "@/services/animals";
import type { AnimalStatusResponse } from "@/services/types";

/** Shared animal status catalog (cached across the screens that need it). */
export function useAnimalStatuses() {
  return useQuery({
    queryKey: ["animal-statuses"],
    queryFn: () => getAnimalStatuses("es"),
    staleTime: 5 * 60 * 1000,
  });
}

/** Codes of animals still in the herd (everything but sold / dead / culled). */
export function activeStatusCodes(statuses: AnimalStatusResponse[]): string[] {
  return statuses.filter((s) => s.is_active !== false).map((s) => s.code);
}

/** Codes of animals out of the herd: sold, dead or culled. */
export function inactiveStatusCodes(statuses: AnimalStatusResponse[]): string[] {
  return statuses.filter((s) => s.is_active === false).map((s) => s.code);
}
