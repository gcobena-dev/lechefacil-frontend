import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAnimalEvents,
  registerAnimalEvent,
  type AnimalEvent,
  type RegisterEventPayload,
  type EventEffects,
  type AnimalEventListResponse,
} from '@/services/animalEvents';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

/**
 * Hook to fetch animal events (timeline)
 */
export const useAnimalEvents = (
  animalId: string | undefined,
  page: number = 1,
  perPage: number = 10
) => {
  return useQuery<AnimalEventListResponse, Error>({
    queryKey: ['animal-events', animalId, page, perPage],
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
      queryClient.invalidateQueries({ queryKey: ['animal-events', animalId] });
      queryClient.invalidateQueries({ queryKey: ['animal-lactations', animalId] });
      queryClient.invalidateQueries({ queryKey: ['animal-detail', animalId] });
      queryClient.invalidateQueries({ queryKey: ['animal', animalId] });

      // Show success message
      toast.success(data.message || t('animals.eventRegistered'));
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || t('animals.eventRegisterError');
      toast.error(String(message));
    },
  });
};
