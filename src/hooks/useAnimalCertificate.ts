import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAnimalCertificate,
  createCertificate,
  updateCertificate,
  deleteCertificate,
  type AnimalCertificate,
  type CertificateUpdatePayload,
} from "@/services/animalCertificates";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

/**
 * Hook to fetch animal certificate
 */
export const useAnimalCertificate = (animalId: string | undefined) => {
  return useQuery<AnimalCertificate | null, Error>({
    queryKey: ["animal-certificate", animalId],
    queryFn: () => getAnimalCertificate(animalId!),
    enabled: !!animalId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

/**
 * Hook to create a certificate
 */
export const useCreateCertificate = (animalId: string) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (payload: any) => createCertificate(animalId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["animal-certificate", animalId],
      });
      toast.success(t("animals.certificateCreated"));
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || t("animals.certificateCreateError");
      toast.error(String(message));
    },
  });
};

/**
 * Hook to update a certificate
 */
export const useUpdateCertificate = (animalId: string) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<AnimalCertificate, Error, CertificateUpdatePayload>({
    mutationFn: (payload) => updateCertificate(animalId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["animal-certificate", animalId],
      });
      toast.success(t("animals.certificateUpdated"));
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || t("animals.certificateUpdateError");
      toast.error(String(message));
    },
  });
};

/**
 * Hook to delete a certificate
 */
export const useDeleteCertificate = (animalId: string) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: () => deleteCertificate(animalId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["animal-certificate", animalId],
      });
      toast.success(t("animals.certificateDeleted"));
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || t("animals.certificateDeleteError");
      toast.error(String(message));
    },
  });
};
