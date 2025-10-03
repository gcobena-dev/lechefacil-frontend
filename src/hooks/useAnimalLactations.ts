import { useQuery } from '@tanstack/react-query';
import {
  getAnimalLactations,
  getLactationDetail,
  type Lactation,
} from '@/services/lactations';

/**
 * Hook to fetch animal lactations with metrics
 */
export const useAnimalLactations = (animalId: string | undefined) => {
  return useQuery<Lactation[], Error>({
    queryKey: ['animal-lactations', animalId],
    queryFn: () => getAnimalLactations(animalId!),
    enabled: !!animalId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to fetch a specific lactation detail
 */
export const useLactationDetail = (lactationId: string | undefined) => {
  return useQuery<Lactation, Error>({
    queryKey: ['lactation-detail', lactationId],
    queryFn: () => getLactationDetail(lactationId!),
    enabled: !!lactationId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
