import { useQuery } from "@tanstack/react-query";
import { getAnimal } from "@/services/animals";
import { listMilkProductions } from "@/services/milkProductions";
import { generateProductionReport } from "@/services/reports";
import { useTenantSettings } from "@/hooks/useTenantSettings";

interface AnimalDetailData {
  animal: any;
  productionData: any[];
  productionSummary: {
    totalLiters: number;
    avgDaily: number;
    totalEarnings: number;
    recordsCount: number;
    daysWithRecords: number;
  };
}

export function useAnimalDetail(animalId: string) {
  const { data: tenantSettings } = useTenantSettings();

  // Calculate date ranges
  // Use -89 so the inclusive range [ninetyDaysAgo, today] covers exactly 90 days
  const today = new Date();
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(today.getDate() - 89);

  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  // Fetch animal details
  const animalQuery = useQuery({
    queryKey: ["animal", animalId],
    queryFn: () => getAnimal(animalId),
    enabled: Boolean(animalId),
  });

  // Fetch production data for last 90 days (limit: 500 to get all records)
  const productionQuery = useQuery({
    queryKey: [
      "animal-production",
      animalId,
      formatDate(ninetyDaysAgo),
      formatDate(today),
    ],
    queryFn: () =>
      listMilkProductions({
        animal_id: animalId,
        date_from: formatDate(ninetyDaysAgo),
        date_to: formatDate(today),
        limit: 500,
      }),
    enabled: Boolean(animalId),
  });

  // Process data to calculate summary statistics
  const processedData: AnimalDetailData | null =
    animalQuery.data && productionQuery.data
      ? {
          animal: animalQuery.data,
          productionData: productionQuery.data,
          productionSummary: (() => {
            const productions = productionQuery.data;
            const defaultPrice = tenantSettings?.default_price_per_l || 0;

            // Calculate total stats (90 days)
            const totalLiters = productions.reduce(
              (sum, p) => sum + parseFloat(p.volume_l),
              0
            );
            const totalEarnings = productions.reduce((sum, p) => {
              const price = p.price_snapshot
                ? parseFloat(p.price_snapshot)
                : defaultPrice;
              return sum + parseFloat(p.volume_l) * price;
            }, 0);
            const recordsCount = productions.length;

            // Calculate unique days with records in the 90-day period
            const uniqueDays = new Set(
              productions.map((p) => new Date(p.date_time).toDateString())
            ).size;
            const avgDaily = uniqueDays > 0 ? totalLiters / uniqueDays : 0;

            return {
              totalLiters,
              avgDaily,
              totalEarnings,
              recordsCount,
              daysWithRecords: uniqueDays,
            };
          })(),
        }
      : null;

  return {
    data: processedData,
    isLoading: animalQuery.isLoading || productionQuery.isLoading,
    error: animalQuery.error || productionQuery.error,
    refetch: () => {
      animalQuery.refetch();
      productionQuery.refetch();
    },
  };
}
