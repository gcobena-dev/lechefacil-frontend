import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAnimalEvents,
  registerAnimalEvent,
  type AnimalEvent,
  type RegisterEventPayload,
  type EventEffects,
  type AnimalEventListResponse,
} from "@/services/animalEvents";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import { invalidateReproductionQueries } from "@/lib/queryInvalidation";

/**
 * Hook to fetch animal events (timeline)
 */
export const useAnimalEvents = (
  animalId: string | undefined,
  page: number = 1,
  perPage: number = 10
) => {
  return useQuery<AnimalEventListResponse, Error>({
    queryKey: ["animal-events", animalId, page, perPage],
    queryFn: () => getAnimalEvents(animalId!, page, perPage),
    enabled: !!animalId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to register a new animal event
 */
export const useRegisterAnimalEvent = (animalId: string) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<EventEffects, Error, RegisterEventPayload>({
    mutationFn: (payload) => registerAnimalEvent(animalId, payload),
    onSuccess: (data) => {
      // Invalidate related queries
      // An event moves the animal's status and lactation, so the list, the
      // dashboard counters, the detail and the reproductive buckets all hold
      // an outdated copy.
      void invalidateReproductionQueries(queryClient);

      // Show success message
      toast.success(data.message || t("animals.eventRegistered"));
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || t("animals.eventRegisterError");
      toast.error(String(message));
    },
  });
};
