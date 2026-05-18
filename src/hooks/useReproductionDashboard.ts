import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  getReproductionKPIs,
  listReproductiveAnimals,
  type ReproductiveBucket,
} from "@/services/reproductionDashboard";

export function useReproductionKPIs(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ["reproduction-kpis", dateFrom, dateTo],
    queryFn: () => getReproductionKPIs(dateFrom, dateTo),
    staleTime: 5 * 60 * 1000,
  });
}

export function useReproductiveAnimals(params: {
  filter: ReproductiveBucket;
  sort?: "postpartum" | "tag" | "name";
  sort_dir?: "asc" | "desc";
  search?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ["reproductive-animals", params],
    queryFn: () => listReproductiveAnimals(params),
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  });
}
