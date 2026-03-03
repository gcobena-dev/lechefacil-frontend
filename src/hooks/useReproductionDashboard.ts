import { useQuery } from "@tanstack/react-query";
import { getReproductionKPIs } from "@/services/reproductionDashboard";

export function useReproductionKPIs(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ["reproduction-kpis", dateFrom, dateTo],
    queryFn: () => getReproductionKPIs(dateFrom, dateTo),
    staleTime: 5 * 60 * 1000,
  });
}
