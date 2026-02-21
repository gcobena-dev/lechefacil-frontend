import { apiFetch, ApiError } from "./client";

export interface AnimalCertificate {
  id: string;
  tenant_id: string;
  animal_id: string;
  registry_number?: string;
  bolus_id?: string;
  tattoo_left?: string;
  tattoo_right?: string;
  issue_date?: string;
  breeder?: string;
  owner?: string;
  farm?: string;
  certificate_name?: string;
  association_code?: string;
  notes?: string;
  data?: Record<string, any>;
  created_at: string;
  updated_at: string;
  version: number;
  // Enriched fields
  animal_tag?: string;
  animal_name?: string;
}

export interface CertificateCreatePayload {
  animal_id: string;
  registry_number?: string;
  bolus_id?: string;
  tattoo_left?: string;
  tattoo_right?: string;
  issue_date?: string;
  breeder?: string;
  owner?: string;
  farm?: string;
  certificate_name?: string;
  association_code?: string;
  notes?: string;
  data?: Record<string, any>;
}

export interface CertificateUpdatePayload {
  version: number;
  registry_number?: string;
  bolus_id?: string;
  tattoo_left?: string;
  tattoo_right?: string;
  issue_date?: string;
  breeder?: string;
  owner?: string;
  farm?: string;
  certificate_name?: string;
  association_code?: string;
  notes?: string;
  data?: Record<string, any>;
}

/**
 * Get the certificate for an animal
 */
export const getAnimalCertificate = async (
  animalId: string
): Promise<AnimalCertificate | null> => {
  try {
    return await apiFetch<AnimalCertificate>(
      `/api/v1/animals/${animalId}/certificate`,
      {
        method: "GET",
        withAuth: true,
        withTenant: true,
      }
    );
  } catch (error: any) {
    if (error.status === 404) {
      return null;
    }
    throw error;
  }
};

/**
 * Create a certificate for an animal
 */
export const createCertificate = async (
  animalId: string,
  payload: Omit<CertificateCreatePayload, "animal_id">
): Promise<AnimalCertificate> => {
  return apiFetch<AnimalCertificate>(
    `/api/v1/animals/${animalId}/certificate`,
    {
      method: "POST",
      body: { ...payload, animal_id: animalId },
      withAuth: true,
      withTenant: true,
    }
  );
};

/**
 * Update an animal's certificate
 */
export const updateCertificate = async (
  animalId: string,
  payload: CertificateUpdatePayload
): Promise<AnimalCertificate> => {
  return apiFetch<AnimalCertificate>(
    `/api/v1/animals/${animalId}/certificate`,
    {
      method: "PUT",
      body: payload,
      withAuth: true,
      withTenant: true,
    }
  );
};

/**
 * Delete an animal's certificate
 */
export const deleteCertificate = async (animalId: string): Promise<void> => {
  await apiFetch<void>(`/api/v1/animals/${animalId}/certificate`, {
    method: "DELETE",
    withAuth: true,
    withTenant: true,
  });
};
