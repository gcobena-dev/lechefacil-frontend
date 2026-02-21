import { apiFetch } from "./client";

export interface Lactation {
  id: string;
  tenant_id: string;
  animal_id: string;
  number: number;
  start_date: string;
  end_date?: string;
  status: "open" | "closed";
  calving_event_id?: string;
  created_at: string;
  updated_at: string;
  version: number;
  // Computed fields
  total_volume_l?: number;
  days_in_milk?: number;
  average_daily_l?: number;
  production_count?: number;
}

export interface LactationMetrics {
  lactation_id: string;
  total_volume_l: number;
  days_in_milk: number;
  average_daily_l: number;
  peak_volume_l?: number;
  peak_date?: string;
  production_count: number;
}

/**
 * Get all lactations for an animal with metrics
 */
export const getAnimalLactations = async (
  animalId: string
): Promise<Lactation[]> => {
  const response = await apiFetch<{ items: Lactation[] }>(
    `/api/v1/animals/${animalId}/lactations`,
    {
      method: "GET",
      withAuth: true,
      withTenant: true,
    }
  );
  return response.items;
};

/**
 * Get details of a specific lactation with metrics
 */
export const getLactationDetail = async (
  lactationId: string
): Promise<Lactation> => {
  return apiFetch<Lactation>(`/api/v1/lactations/${lactationId}`, {
    method: "GET",
    withAuth: true,
    withTenant: true,
  });
};

/**
 * Helper to calculate lactation duration in days
 */
export const calculateDaysInMilk = (lactation: Lactation): number => {
  if (!lactation.start_date) return 0;

  const startDate = new Date(lactation.start_date);
  const endDate = lactation.end_date
    ? new Date(lactation.end_date)
    : new Date();

  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

/**
 * Helper to format lactation status
 */
export const getLactationStatusLabel = (status: string): string => {
  // Return i18n key; UI should translate with t(key)
  return status === "open"
    ? "animals.lactationOpen"
    : "animals.lactationClosed";
};

/**
 * Helper to get lactation status color
 */
export const getLactationStatusColor = (status: string): string => {
  return status === "open"
    ? "bg-green-100 text-green-800"
    : "bg-gray-100 text-gray-800";
};
